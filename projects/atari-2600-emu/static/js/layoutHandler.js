
function alignTVScreen(screen, tv) {
    // CVHEIGHT TO OVERLAYHEIGHT = 0.7421236872812135
    // CVWIDTH TO OVERLAYWIDTH = 0.6579352850539291

    // TODO: get ratios dinamically
    // these come from the original tv frame .png
    let FRAMEWIDTH = 1298;
    let FRAMEHEIGHT = 857;
    let SCREENWIDTH = 854;
    let SCREENHEIGHT = 636;
    let TOPLIP = 82;
    let LEFTLIP = 96;

    let offset = $("#tv-frame").offset();
    let scale = {
        width: tv.width() / FRAMEWIDTH,
        height: tv.height() / FRAMEHEIGHT
    };
    
    screen.width(tv.width() * SCREENWIDTH / FRAMEWIDTH); // (screen.height / frameheight) * scale
    screen.height(tv.height() * SCREENHEIGHT / FRAMEHEIGHT);

    screen.offset({
        top: offset.top + (scale.height * TOPLIP), // top part height
        left: offset.left + (scale.width * LEFTLIP)
    });
}

// make canvas colorful
let canvas = document.getElementById("tv-screen");
let ctx = canvas.getContext("2d");
alignTVScreen($("#tv-screen"), $("#tv-frame"));

randColor();
setInterval(randColor, 250);


function randColor() {
    ctx.fillStyle = "#" + Math.random().toFixed(6).toString(16).substring(2, 8);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

window.onresize = () => {
    alignTVScreen($("#tv-screen"), $("#tv-frame"));
}