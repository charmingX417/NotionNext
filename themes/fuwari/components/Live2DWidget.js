'use client'

import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'
import { isBrowser } from '@/lib/utils'
import CONFIG from '../config'

const CDN_BASE = '/live2d-master/live2d_3'
// PIXI Loader baseUrl：模型资源所在的相对根目录，物理路径为
// e:\NotionNext\public\live2d-master\live2d_3\model\<作者>\<角色>\...
const MODEL_BASE = `${CDN_BASE}/model`

const ONLY_MODEL = 'Azue Lane(JP)/lafei_4'
const ONLY_MODEL_NAME = 'Laffey (New Year Rabbit)'

const Live2DWidget = () => {
  const containerRef = useRef(null)
  const canvasContainerRef = useRef(null)
  const stateRef = useRef({
    viewer: null,
    l2d: null,
    app: null,
    model: null,
    models: {},
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    posX: 0,
    posY: 0,
    isClick: false,
    initialized: false,
  })
  const [visible, setVisible] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [motions, setMotions] = useState([])

  useEffect(() => {
    const enabled = siteConfig('FUWARI_LIVE2D_ENABLE', false, CONFIG)
    console.log('[Live2D][mount] component mounted', {
      enabled,
      scrollY: typeof window !== 'undefined' ? window.scrollY : null,
      hasRightFloatArea: typeof document !== 'undefined'
        ? !!document.querySelector('[data-l2d-host]')
        : false
    })
    if (!enabled) return

    // 始终可见（不再绑定滚动）。可选：滚到底时收起。
    setVisible(true)

    // 页面进入即开始加载脚本与模型（无需点击）
    loadScriptsAndInit()

    // 保留滚动事件，便于未来做「滚到底自动收起」之类扩展
    const onScroll = () => {
      // eslint-disable-next-line no-unused-vars
      const _v = window.scrollY
      // 占位：保持监听以观察滚动行为，不改变 visible
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initLive2D = async () => {
    console.log('[Live2D][init] start', {
      isBrowser,
      alreadyInitialized: stateRef.current.initialized,
      hasContainer: !!canvasContainerRef.current,
      model: ONLY_MODEL
    })
    if (!isBrowser || stateRef.current.initialized) return
    stateRef.current.initialized = true

    const L2D = createL2DClass()
    const viewer = createViewerClass(L2D)
    stateRef.current.viewer = viewer
    stateRef.current.l2d = viewer.l2d
    console.log('[Live2D][init] viewer created', {
      hasL2DClass: !!L2D,
      hasViewer: !!viewer,
      hasL2D: !!viewer.l2d,
      hasPIXI: !!(window.PIXI),
      hasFramework: !!window.LIVE2DCUBISMFRAMEWORK,
      hasCubismPixi: !!window.LIVE2DCUBISMPIXI,
      hasCore: !!window.Live2DCubismCore
    })

    try {
      await viewer.init(canvasContainerRef.current, ONLY_MODEL)
      console.log('[Live2D][init] viewer.init resolved')
    } catch (e) {
      console.error('[Live2D] Init failed:', e)
    }
  }

  const createL2DClass = () => {
    const { PIXI } = window
    if (!PIXI) {
      console.error('[Live2D][loader] window.PIXI is missing')
      return null
    }
    if (!window.LIVE2DCUBISMFRAMEWORK) {
      console.error('[Live2D][loader] window.LIVE2DCUBISMFRAMEWORK is missing')
      return null
    }

    class L2DLoader {
      constructor(basePath) {
        this.basePath = basePath
        this.loader = new PIXI.loaders.Loader(this.basePath)
        this.animatorBuilder = new window.LIVE2DCUBISMFRAMEWORK.AnimatorBuilder()
        this.timeScale = 1
        this.models = {}
        this.physicsRigBuilder = null
      }

      setPhysics3Json(value) {
        if (!this.physicsRigBuilder) {
          this.physicsRigBuilder = new window.LIVE2DCUBISMFRAMEWORK.PhysicsRigBuilder()
        }
        this.physicsRigBuilder.setPhysics3Json(value)
        return this
      }

      load(name, viewerRef) {
        const self = this
        console.log('[Live2D][loader.load] request', { name, cached: !!this.models[name] })
        if (this.models[name]) {
          viewerRef.changeCanvas(this.models[name])
          return
        }

        let modelDir = name + '/'
        let shortName = name.split('/').pop()
        let modelPath = shortName + '.model3.json'
        const url = `${this.loader.baseUrl}${modelDir}${modelPath}`
        console.log('[Live2D][loader.load] fetch model3.json', { url })

        this.loader.add(shortName + '_model', modelDir + modelPath, {
          xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON
        })

        this.loader.onError.add((err) => {
          console.error('[Live2D][loader.load] PIXI loader error', err)
        })

        this.loader.load(function (loader, resources) {
          console.log('[Live2D][loader.load] model3.json loaded', {
            name,
            hasResource: !!resources[shortName + '_model'],
            url
          })
          let model3Obj = resources[shortName + '_model'].data
          if (!model3Obj) {
            console.error('[Live2D][loader.load] model3Obj is null', { url })
            return
          }
          console.log('[Live2D][loader.load] model3Obj keys', {
            hasFileReferences: !!model3Obj.FileReferences,
            moc: model3Obj.FileReferences?.Moc,
            textures: model3Obj.FileReferences?.Textures?.length || 0,
            physics: model3Obj.FileReferences?.Physics,
            motionGroups: model3Obj.FileReferences?.Motions
              ? Object.keys(model3Obj.FileReferences.Motions)
              : []
          })

          if (model3Obj.FileReferences && model3Obj.FileReferences.Moc) {
            loader.add(shortName + '_moc', modelDir + model3Obj.FileReferences.Moc, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.BUFFER
            })
          }

          let textureCount = 0
          if (model3Obj.FileReferences && model3Obj.FileReferences.Textures) {
            model3Obj.FileReferences.Textures.forEach(function (el) {
              loader.add(shortName + '_texture' + textureCount, modelDir + el)
              textureCount++
            })
          }

          if (model3Obj.FileReferences && model3Obj.FileReferences.Physics) {
            loader.add(shortName + '_physics', modelDir + model3Obj.FileReferences.Physics, {
              xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON
            })
          }

          let motionNames = []
          if (model3Obj.FileReferences && model3Obj.FileReferences.Motions) {
            for (let group in model3Obj.FileReferences.Motions) {
              model3Obj.FileReferences.Motions[group].forEach(function (el) {
                let mName = el.File.split('/').pop().split('.').shift()
                loader.add(shortName + '_' + mName, modelDir + el.File, {
                  xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON
                })
                motionNames.push(shortName + '_' + mName)
              })
            }
          }

          let groups = null
          if (model3Obj.Groups) {
            groups = window.LIVE2DCUBISMFRAMEWORK.Groups.fromModel3Json(model3Obj)
          }

          loader.load(function () {
            let moc = null
            if (resources[shortName + '_moc']) {
              moc = window.Live2DCubismCore.Moc.fromArrayBuffer(resources[shortName + '_moc'].data)
            }

            let textures = []
            if (resources[shortName + '_texture0']) {
              for (let i = 0; i < textureCount; i++) {
                if (resources[shortName + '_texture' + i]) {
                  textures[i] = resources[shortName + '_texture' + i].texture
                }
              }
            }

            if (resources[shortName + '_physics']) {
              self.setPhysics3Json(resources[shortName + '_physics'].data)
            }

            let motionsMap = new Map()
            motionNames.forEach(function (el) {
              let n = el.split(shortName + '_').pop()
              motionsMap.set(n, window.LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(resources[el].data))
            })

            let coreModel = window.Live2DCubismCore.Model.fromMoc(moc)
            if (!coreModel) return

            let animator = self.animatorBuilder
              .setTarget(coreModel)
              .setTimeScale(self.timeScale)
              .build()

            let physicsRig = null
            if (self.physicsRigBuilder) {
              physicsRig = self.physicsRigBuilder
                .setTarget(coreModel)
                .setTimeScale(self.timeScale)
                .build()
            }

            let model = window.LIVE2DCUBISMPIXI.Model._create(coreModel, textures, animator, physicsRig, null, groups)
            model.motions = motionsMap
            self.models[name] = model
            console.log('[Live2D][loader.load] model ready', {
              name,
              textures: textures.length,
              motions: motionNames.length,
              hasPhysics: !!physicsRig,
              hasGroups: !!groups
            })
            viewerRef.changeCanvas(model)
          })
        })
      }
    }

    return L2DLoader
  }

  const createViewerClass = (L2DClass) => {
    const { PIXI } = window

    class Viewer {
      constructor() {
        try {
          this.l2d = new L2DClass(`${MODEL_BASE}`)
        } catch (e) {
          console.error('[Live2D][Viewer.constructor] L2DClass instantiation failed', e)
          this.l2d = null
        }
        this.model = null
        this.app = null
        this.container = null
        this.isClick = false
      }

      // Live2D Cubism 模型画布像素是 2048×2048 左右，
      // 容器实际只有 160×90，需要把 canvas 调整到容器尺寸，
      // 并按容器的"高度"反算模型 scale，使模型铺满容器。
      // 模型 Canvas 内部坐标是 (modelCanvasSize × modelCanvasSize)。
      calculateScale(containerWidth, containerHeight, model) {
        // PIXI 模型对象的 width/height 通常是模型原始画布尺寸（2048 或 1024 等）
        const modelW = model?.width || 2048
        const modelH = model?.height || 2048
        const fit = Math.min(containerWidth / modelW, containerHeight / modelH)
        return Math.max(fit, 0.0001) * 0.9
      }

      init(container, modelName) {
        return new Promise((resolve) => {
          const { PIXI } = window
          this.container = container
          const rect = container.getBoundingClientRect()
          const width = rect.width || 160
          const height = rect.height || 90
          console.log('[Live2D][viewer.init] called', {
            modelName,
            hasContainer: !!container,
            containerTagName: container?.tagName,
            childCount: container?.childNodes?.length,
            containerW: width,
            containerH: height
          })

          this.app = new PIXI.Application(width, height, {
            backgroundColor: 0x000000,
            transparent: true,
            autoDensity: true
          })
          console.log('[Live2D][viewer.init] PIXI.Application created', {
            viewWidth: this.app.view.width,
            viewHeight: this.app.view.height
          })

          this.app.view.style.width = '100%'
          this.app.view.style.height = '100%'
          this.app.renderer.resize(width, height)

          container.innerHTML = ''
          container.appendChild(this.app.view)
          console.log('[Live2D][viewer.init] canvas mounted', {
            containerRect: container.getBoundingClientRect()
          })

          this.app.ticker.add((delta) => {
            if (!this.model) return
            this.model.update(delta)
            if (this.model.masks) {
              this.model.masks.update(this.app.renderer)
            }
          })

          this.setupEvents(container)
          this.l2d.load(modelName, this)

          this.onResize = () => {
            const w = window.innerWidth
            const h = (w / 16.0) * 9.0
            this.app.view.style.width = w + 'px'
            this.app.view.style.height = h + 'px'
            this.app.renderer.resize(w, h)

            if (this.model) {
              this.model.position = new PIXI.Point(w * 0.5, h * 0.5)
              this.model.scale = new PIXI.Point(this.model.position.x * 0.06, this.model.position.x * 0.06)
              if (this.model.masks) {
                this.model.masks.resize(this.app.view.width, this.app.view.height)
              }
            }
          }
          window.addEventListener('resize', this.onResize)

          const checkModel = setInterval(() => {
            if (this.model) {
              clearInterval(checkModel)
              console.log('[Live2D][viewer.init] model attached, resolving init promise')
              resolve()
            }
          }, 200)
        })
      }

      setupEvents(canvas) {
        const self = this

        canvas.addEventListener('mousedown', function (e) {
          self.isClick = true
        })

        canvas.addEventListener('mousemove', function (e) {
          if (self.isClick) {
            self.isClick = false
            if (self.model) {
              self.model.inDrag = true
            }
          }
          if (self.model) {
            let mouseX = self.model.position.x - e.offsetX
            let mouseY = self.model.position.y - e.offsetY
            self.model.pointerX = -mouseX / self.app.view.height
            self.model.pointerY = -mouseY / self.app.view.width
          }
        })

        canvas.addEventListener('mouseup', function (e) {
          if (!self.model) return
          if (self.isClick) {
            if (self.isHit('TouchHead', e.offsetX, e.offsetY)) {
              self.startAnimation('touch_head', 'base')
            } else if (self.isHit('TouchSpecial', e.offsetX, e.offsetY)) {
              self.startAnimation('touch_special', 'base')
            } else {
              const bodyMotions = ['touch_body', 'main_1', 'main_2', 'main_3']
              let currentMotion = bodyMotions[Math.floor(Math.random() * bodyMotions.length)]
              self.startAnimation(currentMotion, 'base')
            }
          }
          self.isClick = false
          if (self.model) self.model.inDrag = false
        })
      }

      changeCanvas(model) {
        const { PIXI } = window
        console.log('[Live2D][changeCanvas]', {
          hasModel: !!model,
          hasApp: !!this.app
        })
        this.app.stage.removeChildren()

        this.model = model
        if (!this.model) return

        this.model.update = this.onUpdate
        this.model.animator.addLayer('base', window.LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1)

        this.app.stage.addChild(this.model)
        if (this.model.masks) {
          this.app.stage.addChild(this.model.masks)
        }

        const rect = this.container
          ? this.container.getBoundingClientRect()
          : { width: 0, height: 0 }
        const scale = this.calculateScale(rect.width, rect.height, this.model)
        const cx = rect.width * 0.5
        const cy = rect.height * 0.5
        this.model.position = new PIXI.Point(cx, cy)
        this.model.scale = new PIXI.Point(scale, scale)
        console.log('[Live2D][changeCanvas] model placed', {
          x: this.model.position.x,
          y: this.model.position.y,
          scale,
          container: { w: rect.width, h: rect.height }
        })

        const motionKeys = []
        if (this.model.motions) {
          this.model.motions.forEach(function (v, k) {
            motionKeys.push(k)
          })
        }
        setMotions(motionKeys)
        console.log('[Live2D][changeCanvas] motions', motionKeys)

        if (this.onResize) this.onResize()
      }

      onUpdate(delta) {
        let deltaTime = 0.016 * delta

        if (!this.animator.isPlaying) {
          let m = this.motions.get('idle')
          if (m) {
            this.animator.getLayer('base').play(m)
          }
        }
        this._animator.updateAndEvaluate(deltaTime)

        if (this.inDrag) {
          this.addParameterValueById('ParamAngleX', this.pointerX * 30)
          this.addParameterValueById('ParamAngleY', -this.pointerY * 30)
          this.addParameterValueById('ParamBodyAngleX', this.pointerX * 10)
          this.addParameterValueById('ParamBodyAngleY', -this.pointerY * 10)
          this.addParameterValueById('ParamEyeBallX', this.pointerX)
          this.addParameterValueById('ParamEyeBallY', -this.pointerY)
        }

        if (this._physicsRig) {
          this._physicsRig.updateAndEvaluate(deltaTime)
        }

        this._coreModel.update()

        let sort = false
        for (let m = 0; m < this._meshes.length; ++m) {
          this._meshes[m].alpha = this._coreModel.drawables.opacities[m]
          this._meshes[m].visible = window.Live2DCubismCore.Utils.hasIsVisibleBit(this._coreModel.drawables.dynamicFlags[m])
          if (window.Live2DCubismCore.Utils.hasVertexPositionsDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
            this._meshes[m].vertices = this._coreModel.drawables.vertexPositions[m]
            this._meshes[m].dirtyVertex = true
          }
          if (window.Live2DCubismCore.Utils.hasRenderOrderDidChangeBit(this._coreModel.drawables.dynamicFlags[m])) {
            sort = true
          }
        }

        if (sort) {
          this.children.sort(function (a, b) {
            let aIndex = this._meshes.indexOf(a)
            let bIndex = this._meshes.indexOf(b)
            let aOrder = this._coreModel.drawables.renderOrders[aIndex]
            let bOrder = this._coreModel.drawables.renderOrders[bIndex]
            return aOrder - bOrder
          }.bind(this))
        }

        this._coreModel.drawables.resetDynamicFlags()
      }

      startAnimation(motionId, layerId) {
        if (!this.model) return
        let m = this.model.motions.get(motionId)
        if (!m) return
        let l = this.model.animator.getLayer(layerId)
        if (!l) return
        l.play(m)
      }

      isHit(id, posX, posY) {
        if (!this.model) return false
        let m = this.model.getModelMeshById(id)
        if (!m) return false

        const vertexStep = 2
        const vertices = m.vertices
        let left = vertices[0], right = vertices[0], top = vertices[1], bottom = vertices[1]

        for (let i = 1; i < 4; ++i) {
          let x = vertices[i * vertexStep]
          let y = vertices[i * vertexStep + 1]
          if (x < left) left = x
          if (x > right) right = x
          if (y < top) top = y
          if (y > bottom) bottom = y
        }

        let mouseX = m.worldTransform.tx - posX
        let mouseY = m.worldTransform.ty - posY
        let tx = -mouseX / m.worldTransform.a
        let ty = -mouseY / m.worldTransform.d

        return (left <= tx && tx <= right && top <= ty && ty <= bottom)
      }
    }

    return new Viewer()
  }

  const loadScriptsAndInit = async () => {
    console.log('[Live2D][scripts] start loading', { base: CDN_BASE })
    const load = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          console.log('[Live2D][scripts] already present, skip', src)
          resolve()
          return
        }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => {
          console.log('[Live2D][scripts] loaded', src)
          resolve()
        }
        s.onerror = (e) => {
          console.error('[Live2D][scripts] failed', src, e)
          reject(e)
        }
        document.head.appendChild(s)
      })

    try {
      await load(`${CDN_BASE}/js/jquery.min.js`)
      await load(`${CDN_BASE}/js/pixi.min.js`)
      await load(`${CDN_BASE}/js/live2dcubismcore.min.js`)
      await load(`${CDN_BASE}/js/live2dcubismframework.js`)
      await load(`${CDN_BASE}/js/live2dcubismpixi.js`)
      console.log('[Live2D][scripts] all loaded', {
        jQuery: typeof window.jQuery,
        PIXI: typeof window.PIXI,
        LIVE2DCUBISMFRAMEWORK: typeof window.LIVE2DCUBISMFRAMEWORK,
        LIVE2DCUBISMPIXI: typeof window.LIVE2DCUBISMPIXI,
        Live2DCubismCore: typeof window.Live2DCubismCore
      })
      await initLive2D()
    } catch (e) {
      console.error('[Live2D] Script load failed:', e)
    }
  }

  const handleToggle = () => {
    console.log('[Live2D][toggle] click', {
      initialized: stateRef.current.initialized,
      panelOpen,
      hasContainer: !!canvasContainerRef.current
    })
    if (!stateRef.current.initialized) {
      loadScriptsAndInit()
    }
    setPanelOpen(!panelOpen)
  }

  const handleMotion = (motionId) => {
    if (stateRef.current.viewer && stateRef.current.viewer.model) {
      stateRef.current.viewer.startAnimation(motionId, 'base')
    }
  }

  if (!siteConfig('FUWARI_LIVE2D_ENABLE', false, CONFIG)) {
    if (typeof window !== 'undefined') {
      console.log('[Live2D][render] skipped: FUWARI_LIVE2D_ENABLE is false')
    }
    return null
  }
  if (!visible) return null

  console.log('[Live2D][render] rendering widget', { model: ONLY_MODEL })

  return (
    <div ref={containerRef} className='fixed z-40' style={{
      right: '1.05rem',
      bottom: '5.8rem',
      width: '160px',
      height: '90px'
    }}>
      <style jsx global>{`
        .l2d-canvas-wrap {
          width: 160px;
          height: 90px;
          overflow: hidden;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .l2d-canvas-wrap canvas {
          width: 100% !important;
          height: 100% !important;
          border-radius: 12px;
        }
        .l2d-panel {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 220px;
          background: var(--fuwari-surface, #fff);
          border: 1px solid var(--fuwari-border, #e9e8df);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
          overflow: hidden;
        }
        .l2d-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid var(--fuwari-border, #e9e8df);
          background: color-mix(in oklab, var(--fuwari-primary, #b8a320) 6%, var(--fuwari-surface, #fff));
        }
        .l2d-panel-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--fuwari-primary, #b8a320);
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .l2d-panel-body {
          padding: 8px;
          max-height: 280px;
          overflow-y: auto;
        }
        .l2d-panel-body::-webkit-scrollbar {
          width: 4px;
        }
        .l2d-panel-body::-webkit-scrollbar-thumb {
          background: var(--fuwari-border, #e9e8df);
          border-radius: 4px;
        }
        .l2d-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fuwari-muted, #72767d);
          padding: 4px 4px 6px;
        }
        .l2d-motion-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding: 4px;
        }
        .l2d-motion-btn {
          padding: 5px 4px;
          font-size: 10px;
          color: var(--fuwari-muted, #72767d);
          background: var(--fuwari-bg, #f3f4f8);
          border: 1px solid var(--fuwari-border, #e9e8df);
          border-radius: 6px;
          cursor: pointer;
          text-align: center;
          transition: all 0.15s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .l2d-motion-btn:hover {
          background: color-mix(in oklab, var(--fuwari-primary, #b8a320) 8%, var(--fuwari-bg, #f3f4f8));
          color: var(--fuwari-primary, #b8a320);
          border-color: color-mix(in oklab, var(--fuwari-primary, #b8a320) 30%, transparent);
        }
      `}</style>

      <div
        className='l2d-canvas-wrap'
        ref={canvasContainerRef}
        onClick={handleToggle}
      />

      {panelOpen && (
        <div className='l2d-panel'>
          <div className='l2d-panel-header'>
            <span className='l2d-panel-title'>{ONLY_MODEL_NAME}</span>
            <button
              className='fuwari-tool-btn'
              style={{ width: '1.5rem', height: '1.5rem', fontSize: '10px' }}
              onClick={() => setPanelOpen(false)}
            >
              <i className='fas fa-times' />
            </button>
          </div>
          <div className='l2d-panel-body'>
            {motions.length > 0 && (
              <>
                <div className='l2d-section-label'>动作</div>
                <div className='l2d-motion-grid'>
                  {motions.map((m) => (
                    <button
                      key={m}
                      className='l2d-motion-btn'
                      onClick={() => handleMotion(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Live2DWidget