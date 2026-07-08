'use client'

import { useEffect, useRef, useState } from 'react'
import { siteConfig } from '@/lib/config'
import { isBrowser } from '@/lib/utils'
import CONFIG from '../config'

const CDN_BASE = '/live2d-master/live2d_3'
const MODEL_BASE = `${CDN_BASE}/model`

const ONLY_MODEL = 'Azue Lane(JP)/lafei_4'
const ONLY_MODEL_NAME = 'Laffey (New Year Rabbit)'

// 模型展示配置（用户主动配置，不属于模型缺失数据的后备）
const MODEL_CONFIG = {
  zoom: 1.0, 
  offsetX: 0, 
  offsetY: 0  
}

// 个性化动作触发配置
const MOTION_RULES = {
  onFirstLoad: ['login', 'home'],                           
  onReturn: ['complete', 'mail', 'mission'],                
  idleTimeoutMs: 60 * 1000,                                 
  idleMotions: ['mail', 'main_1', 'main_2', 'main_3'],      
  onBodyClickMotions: [
    'mail', 'main_1', 'main_2', 'main_3',
    'complete', 'mission', 'touch_body'
  ],
  touchSpecialMotion: 'touch_special'
}

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
  const idleTimerRef = useRef(null)             
  const hasTriggeredFirstLoadRef = useRef(false) 
  const lastInteractionRef = useRef(Date.now())  

  const playFromPool = (pool) => {
    const viewer = stateRef.current.viewer
    if (!viewer || !viewer.model || !Array.isArray(pool) || pool.length === 0) return
    const available = pool.filter((name) => viewer.model.motions && viewer.model.motions.get(name))
    if (available.length === 0) return
    const picked = available[Math.floor(Math.random() * available.length)]
    viewer.startAnimation(picked, 'base')
    lastInteractionRef.current = Date.now()
  }

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    lastInteractionRef.current = Date.now()
    idleTimerRef.current = setTimeout(() => {
      const viewer = stateRef.current.viewer
      if (viewer && viewer.model && !viewer.model.animator.isPlaying) {
        playFromPool(MOTION_RULES.idleMotions)
      }
      resetIdleTimer()
    }, MOTION_RULES.idleTimeoutMs)
  }

  useEffect(() => {
    const enabled = siteConfig('FUWARI_LIVE2D_ENABLE', false, CONFIG)
    if (!enabled) return

    loadScriptsAndInit()

    const onScroll = () => {}
    window.addEventListener('scroll', onScroll, { passive: true })

    const onVisibilityChange = () => {
      if (!document.hidden) {
        playFromPool(MOTION_RULES.onReturn)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [])

  const initLive2D = async () => {
    if (!isBrowser || stateRef.current.initialized) return
    stateRef.current.initialized = true

    const L2D = createL2DClass()
    const viewer = createViewerClass(L2D)
    stateRef.current.viewer = viewer
    stateRef.current.l2d = viewer.l2d

    try {
      await viewer.init(canvasContainerRef.current, ONLY_MODEL)
    } catch (e) {
      console.error('[Live2D] Init failed:', e)
    }
  }

  const createL2DClass = () => {
    const { PIXI } = window
    if (!PIXI) return null
    if (!window.LIVE2DCUBISMFRAMEWORK) return null

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
        if (this.models[name]) {
          viewerRef.changeCanvas(this.models[name])
          return
        }

        let modelDir = name + '/'
        let shortName = name.split('/').pop()
        let modelPath = shortName + '.model3.json'
        
        this.loader.add(shortName + '_model', modelDir + modelPath, {
          xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON
        })

        this.loader.load(function (loader, resources) {
          let model3Obj = resources[shortName + '_model'].data
          if (!model3Obj) return

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
          this.l2d = null
        }
        this.model = null
        this.app = null
        this.container = null
        this.isClick = false
      }

      // ★ 严格模式：拒绝任何默认值，如果获取不到尺寸直接抛出致命错误
      getNativeSize() {
        if (this._cachedNativeSize) {
          return this._cachedNativeSize
        }

        const coreModel = this.model?._coreModel
        if (!coreModel || !coreModel.canvasinfo) {
          throw new Error('[Live2D] 致命错误：无法获取 coreModel 或 canvasinfo，模型可能损坏或与当前 SDK 不兼容。')
        }

        const info = coreModel.canvasinfo
        const width = info.CanvasWidth
        const height = info.CanvasHeight
        const originX = info.CanvasOriginX
        const originY = info.CanvasOriginY
        const ppu = info.PixelsPerUnit

        // 逐项进行严格校验
        if (typeof width !== 'number' || width <= 0) throw new Error('[Live2D] 致命错误：读取到无效的 CanvasWidth')
        if (typeof height !== 'number' || height <= 0) throw new Error('[Live2D] 致命错误：读取到无效的 CanvasHeight')
        if (typeof originX !== 'number') throw new Error('[Live2D] 致命错误：读取到无效的 CanvasOriginX')
        if (typeof originY !== 'number') throw new Error('[Live2D] 致命错误：读取到无效的 CanvasOriginY')
        if (typeof ppu !== 'number' || ppu <= 0) throw new Error('[Live2D] 致命错误：缺少关键属性 PixelsPerUnit (PPU) 或数值异常')

        const size = { width, height, originX, originY, ppu }
        
        console.log('[Live2D][Size] 已严格校验并获取到逻辑画布参数:', size)
        this._cachedNativeSize = size
        return size
      }

      // ★ 严格模式：拒绝默认容器尺寸，要求 DOM 必须通过 CSS 提供确切高度
      syncRendererSize(nativeSize) {
        if (!this.container) {
          throw new Error('[Live2D] 致命错误：DOM 容器未挂载！')
        }

        const targetHeight = this.container.clientHeight
        if (!targetHeight || targetHeight <= 0) {
          throw new Error('[Live2D] 致命错误：容器的 clientHeight 为 0。请检查 CSS，必须为 .l2d-canvas-wrap 赋予有效的高度！')
        }

        // 以高度为基准，严格遵循模型的宽高比例算出物理宽度
        const aspectRatio = nativeSize.width / nativeSize.height
        const targetWidth = Math.round(targetHeight * aspectRatio)

        // 反向写入 CSS
        if (this.container.closest('.l2d-widget-root')) {
          const rootNode = this.container.closest('.l2d-widget-root')
          rootNode.style.setProperty('--l2d-w', `${targetWidth}px`)
          rootNode.style.setProperty('--l2d-h', `${targetHeight}px`)
        }

        const containerW = targetWidth
        const containerH = targetHeight
        this.app.renderer.resize(containerW, containerH)
        this.app.view.style.width = '100%'
        this.app.view.style.height = '100%'

        // 计算带 PPU 的最终物理矩阵
        const baseScale = containerH / nativeSize.height
        const finalScale = baseScale * nativeSize.ppu * MODEL_CONFIG.zoom
        
        // 注意：如果拉菲出现倒立现象，请将下方代码改为 new PIXI.Point(finalScale, -finalScale)
        this.model.scale = new PIXI.Point(finalScale, finalScale)

        // 完美居中逻辑
        const centerX = containerW / 2
        const centerY = containerH / 2

        const posX = centerX + (containerW * MODEL_CONFIG.offsetX)
        const posY = centerY + (containerH * MODEL_CONFIG.offsetY)

        this.model.position = new PIXI.Point(posX, posY)

        if (this.model.masks) {
          this.model.masks.resize(containerW, containerH)
        }

        console.log('[Live2D][Size] 渲染对齐完成:', {
          容器尺寸: `${containerW}x${containerH}`,
          矩阵缩放: finalScale,
          坐标位置: `${posX}, ${posY}`
        })
      }

      init(container, modelName) {
        return new Promise((resolve) => {
          const { PIXI } = window
          this.container = container
          // 初始随意值，加载完模型后会由 syncRendererSize 严格接管并覆盖
          const width = 160
          const height = 90

          this.app = new PIXI.Application(width, height, {
            backgroundColor: 0x000000,
            transparent: true,
            autoDensity: true
          })

          this.app.view.style.width = '100%'
          this.app.view.style.height = '100%'
          this.app.renderer.resize(width, height)

          container.innerHTML = ''
          container.appendChild(this.app.view)

          this.app.ticker.add((delta) => {
            if (!this.model) return
            this.model.update(delta)
            if (this.model.masks) {
              this.model.masks.update(this.app.renderer)
            }
          })

          this.setupEvents(container)
          this.l2d.load(modelName, this)

          const checkModel = setInterval(() => {
            if (this.model) {
              clearInterval(checkModel)
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
            const renderW = self.app.renderer.width
            const renderH = self.app.renderer.height
            
            const mouseX = e.offsetX - self.model.position.x
            const mouseY = e.offsetY - self.model.position.y
            
            self.model.pointerX = mouseX / (renderW * 0.5)
            self.model.pointerY = -mouseY / (renderH * 0.5)
          }
        })

        canvas.addEventListener('mouseup', function (e) {
          if (!self.model) return
          if (self.isClick) {
            const hitX = e.offsetX
            const hitY = e.offsetY

            if (self.isHit('TouchHead', hitX, hitY)) {
              self.startAnimation('touch_head', 'base')
            } else if (self.isHit('TouchSpecial', hitX, hitY)) {
              self.startAnimation(MOTION_RULES.touchSpecialMotion, 'base')
            } else {
              const pool = MOTION_RULES.onBodyClickMotions
              const available = pool.filter(
                (name) => self.model.motions && self.model.motions.get(name)
              )
              if (available.length > 0) {
                const picked = available[Math.floor(Math.random() * available.length)]
                self.startAnimation(picked, 'base')
              }
            }
          }
          self.isClick = false
          if (self.model) self.model.inDrag = false
        })
      }

      changeCanvas(model) {
        const { PIXI } = window
        this.app.stage.removeChildren()

        this.model = model
        if (!this.model) return

        this.model.update = this.onUpdate
        this.model.animator.addLayer('base', window.LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1)

        this.app.stage.addChild(this.model)
        if (this.model.masks) {
          this.app.stage.addChild(this.model.masks)
        }

        this._cachedNativeSize = null 

        // ★ 引入 Try-Catch，一旦数据不合法，直接中止渲染并抛出错误日志
        try {
          const nativeSize = this.getNativeSize()
          this.syncRendererSize(nativeSize)
        } catch (error) {
          console.error(error.message)
          // 若校验失败，移除破损的模型以防页面污染
          this.app.stage.removeChildren()
          return 
        }

        const motionKeys = []
        if (this.model.motions) {
          this.model.motions.forEach(function (v, k) {
            motionKeys.push(k)
          })
        }
        setMotions(motionKeys)

        if (!hasTriggeredFirstLoadRef.current) {
          hasTriggeredFirstLoadRef.current = true
          setTimeout(() => {
            playFromPool(MOTION_RULES.onFirstLoad)
            resetIdleTimer()
          }, 300)
        } else {
          resetIdleTimer()
        }

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
    const load = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve()
          return
        }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => {
          resolve()
        }
        s.onerror = (e) => {
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
      await initLive2D()
    } catch (e) {
      console.error('[Live2D] Script load failed:', e)
    }
  }

  const handleToggle = () => {
  }

  const handleMotion = (motionId) => {
    if (stateRef.current.viewer && stateRef.current.viewer.model) {
      stateRef.current.viewer.startAnimation(motionId, 'base')
    }
  }

  if (!siteConfig('FUWARI_LIVE2D_ENABLE', false, CONFIG)) {
    return null
  }
  return (
    <div ref={containerRef} className='fixed z-40 l2d-widget-root'>
      <style jsx global>{`
        #theme-fuwari .l2d-widget-root {
          right: var(--l2d-right, 1rem);
          bottom: var(--l2d-bottom, 0rem);
          /* 取消了硬编码的宽高度，完全由 JS 计算出的变量驱动 */
          width: var(--l2d-w);
          height: var(--l2d-h);
        }
        #theme-fuwari .l2d-canvas-wrap {
          width: var(--l2d-w);
          height: var(--l2d-h);
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
        }
        #theme-fuwari .l2d-canvas-wrap canvas {
          width: 100% !important;
          height: 100% !important;
          border-radius: 12px;
        }
        #theme-fuwari .l2d-panel {
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
        #theme-fuwari .l2d-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-bottom: 1px solid var(--fuwari-border, #e9e8df);
          background: color-mix(in oklab, var(--fuwari-primary, #b8a320) 6%, var(--fuwari-surface, #fff));
        }
        #theme-fuwari .l2d-panel-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--fuwari-primary, #b8a320);
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        #theme-fuwari .l2d-panel-body {
          padding: 8px;
          max-height: 280px;
          overflow-y: auto;
        }
        #theme-fuwari .l2d-panel-body::-webkit-scrollbar {
          width: 4px;
        }
        #theme-fuwari .l2d-panel-body::-webkit-scrollbar-thumb {
          background: var(--fuwari-border, #e9e8df);
          border-radius: 4px;
        }
        #theme-fuwari .l2d-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fuwari-muted, #72767d);
          padding: 4px 4px 6px;
        }
        #theme-fuwari .l2d-motion-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          padding: 4px;
        }
        #theme-fuwari .l2d-motion-btn {
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
        #theme-fuwari .l2d-motion-btn:hover {
          background: color-mix(in oklab, var(--fuwari-primary, #b8a320) 8%, var(--fuwari-bg, #f3f4f8));
          color: var(--fuwari-primary, #b8a320);
          border-color: color-mix(in oklab, var(--fuwari-primary, #b8a320) 30%, transparent);
        }
      `}</style>

      <div
        className='l2d-canvas-wrap'
        ref={canvasContainerRef}
        onClick={handleToggle}
        /* ★ 核心：必须提供一个明确的默认内联高度给容器作为计算起点 */
        style={{ height: '480px' }}
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