# Centered Single Login Warning Design

## Goal

Move the Naive UI warning toast to the visual center of the screen and prevent repeated "登录后体验完整内容" warnings from stacking while the current warning is still visible.

## Approach

- Configure the global `n-message-provider` in `src/App.vue` with a dedicated container class and CSS fixed-center positioning, because Naive UI's built-in `placement` prop does not include a `center` option.
- Keep the single-instance rule local to `src/views/Home.vue`, because the stacking problem comes from repeated blocked home navigation clicks.
- Store the current login-required warning instance in a ref. If it exists, ignore subsequent blocked navigation clicks. Clear the ref through `onAfterLeave` after the toast disappears.

## Testing

- Extend `test/home-auth-state-navigation.test.js` to assert global message placement.
- Assert the home navigation block uses a stored warning instance and avoids creating another warning while one is active.
