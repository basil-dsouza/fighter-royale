const Jimp = require('jimp');

async function removeBackgroundPrecise(imgPath) {
    try {
        const image = await Jimp.read(imgPath);
        let targetColor = Jimp.intToRGBA(image.getPixelColor(0, 0));
        let toVisit = [{ x: 0, y: 0 }, { x: image.bitmap.width - 1, y: 0 }, { x: 0, y: image.bitmap.height - 1 }, { x: image.bitmap.width - 1, y: image.bitmap.height - 1 }];
        let visited = new Set();

        function colorMatch(c1, c2, tolerance = 10) {
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
            if (colorMatch(currentPixel, targetColor, 10)) {
                image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
                toVisit.push({ x: x + 1, y: y });
                toVisit.push({ x: x - 1, y: y });
                toVisit.push({ x: x, y: y + 1 });
                toVisit.push({ x: x, y: y - 1 });
            }
        }
        await image.writeAsync('c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\wall.png');
        console.log(`Successfully restored wall with precise transparency.`);
    } catch (err) {
        console.error(`Error processing precise:`, err);
    }
}
removeBackgroundPrecise('C:\\Users\\basil\\.gemini\\antigravity\\brain\\bd37539b-27c3-4fc8-94c0-a1fe32d9bfa7\\wall_square_filled_1772654856737.png');
