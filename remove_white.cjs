const Jimp = require('jimp');

async function removeBackgroundPreciseWhite(imgPath) {
    try {
        const image = await Jimp.read(imgPath);
        let targetColor = { r: 255, g: 255, b: 255, a: 255 };
        let toVisit = [{ x: 0, y: 0 }, { x: image.bitmap.width - 1, y: 0 }, { x: 0, y: image.bitmap.height - 1 }, { x: image.bitmap.width - 1, y: image.bitmap.height - 1 }];
        let visited = new Set();

        function colorMatch(c1, c2, tolerance = 40) {
            return Math.abs(c1.r - c2.r) <= tolerance &&
                Math.abs(c1.g - c2.g) <= tolerance &&
                Math.abs(c1.b - c2.b) <= tolerance &&
                c1.a > 0;
        }

        while (toVisit.length > 0) {
            let { x, y } = toVisit.pop();
            let key = `${x},${y}`;
            if (visited.has(key)) continue;
            if (x < 0 || x >= image.bitmap.width || y < 0 || y >= image.bitmap.height) continue;
            visited.add(key);

            let currentPixel = Jimp.intToRGBA(image.getPixelColor(x, y));
            if (colorMatch(currentPixel, targetColor)) {
                image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
                toVisit.push({ x: x + 1, y: y });
                toVisit.push({ x: x - 1, y: y });
                toVisit.push({ x: x, y: y + 1 });
                toVisit.push({ x: x, y: y - 1 });
            }
        }
        await image.writeAsync(imgPath);
        console.log(`Successfully processed wider white mask for ${imgPath}`);
    } catch (err) {
        console.error(`Error processing white mask:`, err);
    }
}
async function run() {
    await removeBackgroundPreciseWhite('c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\heal_station.png');
}
run();
