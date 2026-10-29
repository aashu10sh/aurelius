// iOS doesn't resize the page for the on-screen keyboard; it pans the view
// to keep the input in sight. iOS 26 often leaves it panned once the keyboard
// closes, so the tabbed shell sits shifted with a gap under the tab bar
// (https://developer.apple.com/forums/thread/800154). The shell never scrolls
// at the page level, so once no text field has focus we put the page back.

const typing = () => {
  const el = document.activeElement
  return (
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLElement && el.isContentEditable) ||
    (el instanceof HTMLInputElement && !['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'file', 'color'].includes(el.type))
  )
}

const settle = () => {
  if (!typing() && (window.scrollY !== 0 || (window.visualViewport?.offsetTop ?? 0) !== 0)) window.scrollTo(0, 0)
}

// Called from the tabbed layout while it's mounted; returns the cleanup.
export const pinViewport = () => {
  // Focus may be moving to the next field; check once it has landed.
  const onFocusOut = () => requestAnimationFrame(settle)
  document.addEventListener('focusout', onFocusOut)
  window.visualViewport?.addEventListener('resize', settle)
  return () => {
    document.removeEventListener('focusout', onFocusOut)
    window.visualViewport?.removeEventListener('resize', settle)
  }
}
