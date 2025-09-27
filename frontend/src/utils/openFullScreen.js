
export const openFullSecreen = (el) => {
    if (el && el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el && el.webkitRequestFullscreen) { // Safari
        el.webkitRequestFullscreen();
    } else if (el && el.msRequestFullscreen) { // IE11
        el.msRequestFullscreen();
    };
};