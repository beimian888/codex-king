<template>
  <label class="theme-switch">
    <input
      class="theme-switch-input"
      type="checkbox"
      :checked="isDark"
      :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
      @change="toggleTheme"
    />
    <span class="theme-switch-slider round" aria-hidden="true">
      <span class="stars">
        <span class="star star-1" />
        <span class="star star-2" />
        <span class="star star-3" />
        <span class="star star-4" />
      </span>
      <span class="cloud cloud-light cloud-1" />
      <span class="cloud cloud-light cloud-2" />
      <span class="cloud cloud-light cloud-3" />
      <span class="cloud cloud-dark cloud-4" />
      <span class="cloud cloud-dark cloud-5" />
      <span class="cloud cloud-dark cloud-6" />
      <span class="sun-moon">
        <span class="light-ray light-ray-1" />
        <span class="light-ray light-ray-2" />
        <span class="light-ray light-ray-3" />
        <span class="moon-dot moon-dot-1" />
        <span class="moon-dot moon-dot-2" />
        <span class="moon-dot moon-dot-3" />
      </span>
    </span>
  </label>
</template>

<script setup>
import { useTheme } from "@/composables/useTheme";

const { isDark, toggleTheme } = useTheme();
</script>

<style scoped lang="scss">
.theme-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
  flex: 0 0 auto;
}

.theme-switch-input {
  width: 0;
  height: 0;
  opacity: 0;
}

.theme-switch-slider {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  cursor: pointer;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.28), transparent 42%),
    #2196f3;
  border: 1px solid rgba(255, 255, 255, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.52),
    0 6px 12px rgba(32, 50, 78, 0.12);
  transition:
    background-color 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.theme-switch-slider.round {
  border-radius: 34px;
}

.sun-moon {
  position: absolute;
  left: 4px;
  bottom: 4px;
  width: 26px;
  height: 26px;
  z-index: 3;
  border-radius: 50%;
  background: #facc15;
  box-shadow: 0 3px 8px rgba(120, 80, 0, 0.2);
  transition:
    transform 260ms cubic-bezier(0.23, 1, 0.32, 1),
    background-color 220ms ease,
    box-shadow 220ms ease;
}

.moon-dot,
.light-ray,
.cloud,
.star {
  position: absolute;
  display: block;
}

.moon-dot {
  z-index: 4;
  border-radius: 50%;
  background: #8a8f98;
  opacity: 0;
  transition: opacity 220ms ease;
}

.moon-dot-1 {
  left: 10px;
  top: 3px;
  width: 6px;
  height: 6px;
}

.moon-dot-2 {
  left: 2px;
  top: 10px;
  width: 10px;
  height: 10px;
}

.moon-dot-3 {
  left: 16px;
  top: 18px;
  width: 3px;
  height: 3px;
}

.light-ray {
  z-index: -1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
}

.light-ray-1 {
  left: -8px;
  top: -8px;
  width: 43px;
  height: 43px;
}

.light-ray-2 {
  left: -15px;
  top: -15px;
  width: 55px;
  height: 55px;
}

.light-ray-3 {
  left: -18px;
  top: -18px;
  width: 60px;
  height: 60px;
}

.cloud {
  height: 9px;
  z-index: 1;
  border-radius: 999px;
  animation: cloud-move 6s ease-in-out infinite;
}

.cloud::before,
.cloud::after {
  position: absolute;
  content: "";
  border-radius: 50%;
  background: inherit;
}

.cloud::before {
  left: 5px;
  top: -5px;
  width: 12px;
  height: 12px;
}

.cloud::after {
  right: 4px;
  top: -3px;
  width: 10px;
  height: 10px;
}

.cloud-light {
  background: #eef6ff;
}

.cloud-dark {
  background: #d4dde8;
  animation-delay: 1s;
}

.cloud-1 {
  left: 30px;
  top: 17px;
  width: 40px;
}

.cloud-2 {
  left: 44px;
  top: 11px;
  width: 20px;
  transform: scale(0.72);
}

.cloud-3 {
  left: 18px;
  top: 25px;
  width: 30px;
  transform: scale(0.82);
}

.cloud-4 {
  left: 36px;
  top: 19px;
  width: 40px;
}

.cloud-5 {
  left: 48px;
  top: 14px;
  width: 20px;
  transform: scale(0.72);
}

.cloud-6 {
  left: 22px;
  top: 27px;
  width: 30px;
  transform: scale(0.82);
}

.stars {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0;
  transform: translateY(-32px);
  transition:
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.23, 1, 0.32, 1);
}

.star {
  background: #fff;
  clip-path: polygon(
    50% 0%,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  animation: star-twinkle 2s ease-in-out infinite;
}

.star-1 {
  left: 3px;
  top: 2px;
  width: 20px;
  height: 20px;
  animation-delay: 0.3s;
}

.star-2 {
  left: 4px;
  top: 17px;
  width: 6px;
  height: 6px;
}

.star-3 {
  left: 11px;
  top: 21px;
  width: 12px;
  height: 12px;
  animation-delay: 0.6s;
}

.star-4 {
  left: 18px;
  top: 0;
  width: 18px;
  height: 18px;
  animation-delay: 1.3s;
}

.theme-switch-input:checked + .theme-switch-slider {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.12), transparent 44%),
    #0b1020;
  border-color: rgba(148, 163, 184, 0.34);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 6px 12px rgba(0, 0, 0, 0.24);
}

.theme-switch-input:focus-visible + .theme-switch-slider {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}

.theme-switch-input:checked + .theme-switch-slider .sun-moon {
  transform: translateX(26px);
  background: #fff;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.22);
  animation: rotate-center 600ms ease-in-out both;
}

.theme-switch-input:checked + .theme-switch-slider .moon-dot {
  opacity: 1;
}

.theme-switch-input:checked + .theme-switch-slider .stars {
  opacity: 1;
  transform: translateY(0);
}

.theme-switch-input:checked + .theme-switch-slider .cloud {
  opacity: 0;
}

@keyframes cloud-move {
  0%,
  100% {
    transform: translateX(0);
  }

  40% {
    transform: translateX(4px);
  }

  80% {
    transform: translateX(-4px);
  }
}

@keyframes star-twinkle {
  0%,
  100% {
    transform: scale(1);
  }

  40% {
    transform: scale(1.2);
  }

  80% {
    transform: scale(0.8);
  }
}

@keyframes rotate-center {
  0% {
    rotate: 0deg;
  }

  100% {
    rotate: 360deg;
  }
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch-slider,
  .sun-moon,
  .moon-dot,
  .stars {
    transition: none;
  }

  .cloud,
  .star,
  .theme-switch-input:checked + .theme-switch-slider .sun-moon {
    animation: none;
  }
}
</style>
