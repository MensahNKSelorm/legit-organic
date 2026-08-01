// The control room uses one deliberate dark shell across browsers and devices.
(function enforceControlRoomTheme() {
  const apply = () => {
    document.documentElement.classList.remove('light', 'auto');
    document.documentElement.classList.add('dark');
  };

  apply();
  document.addEventListener('alpine:initialized', apply);
  window.addEventListener('load', apply);
})();
