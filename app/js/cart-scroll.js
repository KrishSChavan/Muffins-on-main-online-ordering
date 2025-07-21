const orderListWrapper = document.getElementById('orderListWrapper');
const topShadow = document.querySelector('.top-shadow');
const bottomShadow = document.querySelector('.bottom-shadow');

function updateShadows() {
  const { scrollTop, scrollHeight, clientHeight } = orderListWrapper;

  // Show top shadow if scrolled down even 1px
  topShadow.style.opacity = scrollTop > 0 ? '1' : '0';

  // Show bottom shadow if not at the bottom (with rounding fix)
  const atBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;
  bottomShadow.style.opacity = !atBottom ? '1' : '0';
}

orderListWrapper.addEventListener('scroll', updateShadows);
window.addEventListener('resize', updateShadows);
document.addEventListener('DOMContentLoaded', updateShadows);
