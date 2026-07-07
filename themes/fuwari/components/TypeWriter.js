import { useEffect, useState } from 'react'

/**
 * 打字机效果组件
 * @param {string[]} words - 要轮播显示的文案数组
 * @param {number} typingSpeed - 打字速度（毫秒），默认 100
 * @param {number} deletingSpeed - 删除速度（毫秒），默认 50
 * @param {number} pauseDuration - 打字完成后的停顿时间（毫秒），默认 2000
 */
const TypeWriter = ({
  words = ['Hello World', 'Welcome to my blog'],
  typingSpeed = 100,
  deletingSpeed = 50,
  pauseDuration = 2000
}) => {
  const [displayText, setDisplayText] = useState('')
  const [wordIndex, setWordIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentWord = words[wordIndex]

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        // 打字中
        setDisplayText(currentWord.substring(0, displayText.length + 1))

        if (displayText.length === currentWord.length) {
          // 打字完成，等待后开始删除
          setTimeout(() => setIsDeleting(true), pauseDuration)
          return
        }
      } else {
        // 删除中
        setDisplayText(currentWord.substring(0, displayText.length - 1))

        if (displayText.length === 0) {
          // 删除完成，切换到下一个词
          setIsDeleting(false)
          setWordIndex((prev) => (prev + 1) % words.length)
        }
      }
    }, isDeleting ? deletingSpeed : typingSpeed)

    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseDuration])

  return (
    <span className='fuwari-typewriter'>
      {displayText}
      <span className='fuwari-typewriter-cursor'>|</span>
    </span>
  )
}

export default TypeWriter
