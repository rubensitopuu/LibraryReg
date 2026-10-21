const navigation = document.querySelector("#mainNavigation");

navigation?.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 991.98px)").matches) {
      bootstrap.Collapse.getOrCreateInstance(navigation).hide();
    }
  });
});
