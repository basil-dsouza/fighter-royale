const Jimp = require('jimp');

async function removeBackground(imgPath, bgColor) {
    try {
        const image = await Jimp.read(imgPath);

        // We will do a generic "magic wand" flood fill starting from the top-left corner (0,0)
        // to discover the background color and turn it transparent.

        let targetColor = Jimp.intToRGBA(image.getPixelColor(0, 0));

        // If the top-left pixel is completely transparent or not what we expect
        // we could just hardcode it, but assuming standard jimp behavior

        let toVisit = [{ x: 0, y: 0 }, { x: image.bitmap.width - 1, y: 0 }, { x: 0, y: image.bitmap.height - 1 }, { x: image.bitmap.width - 1, y: image.bitmap.height - 1 }];
        let visited = new Set();

        function colorMatch(c1, c2, tolerance = 30) {
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

            // If it matches the expected background (black for wall, white for turret/powerbox)
            if (colorMatch(currentPixel, targetColor, 60)) {

                // Set to transparent
                image.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);

                toVisit.push({ x: x + 1, y: y });
                toVisit.push({ x: x - 1, y: y });
                toVisit.push({ x: x, y: y + 1 });
                toVisit.push({ x: x, y: y - 1 });
            }
        }

        await image.writeAsync(imgPath);
        console.log(`Successfully processed ${imgPath}`);
    } catch (err) {
        console.error(`Error processing ${imgPath}:`, err);
    }
}

async function runAll() {
    await removeBackground('c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\wall.png');
    await removeBackground('c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\turret.png');
    await removeBackground('c:\\Projects\\Raphael\\FighterRoyale\\public\\assets\\powerbox.png');
}

runAll();
