const canvas = document.getElementById('camCanvas');
const ctx = canvas.getContext('2d');
const select = document.getElementById('fabricSelect');

// Populate dropdown
Object.keys(fabricCamData).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
});

// Draw on selection change
select.addEventListener('change', () => {
    const name = select.value;
    const data = fabricCamData[name];
    drawGraph(data);
});

// Initial draw with first fabric
if (select.options.length > 0) {
    select.selectedIndex = 0;
    drawGraph(fabricCamData[select.value]);
}

// --- Drawing functions ---

function drawGraph(data) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCircularLayout(data);
    drawBarChart(data);
}

function drawCircularLayout(data) {
    const N = data.feeds.length;
    const cx = 350, cy = 280;
    const radiusCyl = 200;
    const radiusDial = 120;

    // Draw cylinder outer circle
    ctx.beginPath();
    ctx.arc(cx, cy, radiusCyl, 0, 2 * Math.PI);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw dial inner circle if double jersey
    if (data.type === 'double') {
        ctx.beginPath();
        ctx.arc(cx, cy, radiusDial, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Draw feed positions
    for (let i = 0; i < N; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / N;  // start from top
        const feed = data.feeds[i];

        // Draw radial line
        const xEnd = cx + radiusCyl * Math.cos(angle);
        const yEnd = cy + radiusCyl * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(xEnd, yEnd);
        ctx.strokeStyle = '#bdc3c7';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Feed number label
        const labelRadius = radiusCyl + 20;
        const labelX = cx + labelRadius * Math.cos(angle);
        const labelY = cy + labelRadius * Math.sin(angle);
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`F${i + 1}`, labelX, labelY);

        // Draw cylinder cam symbol
        drawCamSymbol(cx, cy, angle, radiusCyl, feed.cylinder, 'cylinder');

        // Draw dial cam symbol if double
        if (data.type === 'double' && feed.dial) {
            drawCamSymbol(cx, cy, angle, radiusDial, feed.dial, 'dial');
        }
    }

    // Title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Circular Cam Layout', cx, 30);
}

function drawCamSymbol(cx, cy, angle, radius, camType, side) {
    const posX = cx + radius * Math.cos(angle);
    const posY = cy + radius * Math.sin(angle);

    // Direction: outward for cylinder, inward for dial
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);
    const sign = (side === 'cylinder') ? 1 : -1;

    // Colors
    const colors = {
        knit: '#27ae60',   // green
        tuck: '#f1c40f',   // yellow
        miss: '#e74c3c'    // red
    };
    ctx.fillStyle = colors[camType] || '#95a5a6';
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;

    const baseWidth = 14;
    const length = (camType === 'knit') ? 18 : (camType === 'tuck' ? 10 : 0);

    if (camType === 'miss') {
        // Draw a small flat line
        ctx.beginPath();
        const perpX = -dirY;
        const perpY = dirX;
        ctx.moveTo(posX - baseWidth/2 * perpX, posY - baseWidth/2 * perpY);
        ctx.lineTo(posX + baseWidth/2 * perpX, posY + baseWidth/2 * perpY);
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        // Draw a triangle: apex at distance length from circle, base along tangent
        const apexX = posX + sign * length * dirX;
        const apexY = posY + sign * length * dirY;

        const perpX = -dirY;
        const perpY = dirX;
        const baseLeftX = posX - baseWidth/2 * perpX;
        const baseLeftY = posY - baseWidth/2 * perpY;
        const baseRightX = posX + baseWidth/2 * perpX;
        const baseRightY = posY + baseWidth/2 * perpY;

        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseLeftY);
        ctx.lineTo(baseRightX, baseRightY);
        ctx.lineTo(apexX, apexY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}

function drawBarChart(data) {
    const N = data.feeds.length;
    const chartX = 60, chartY = 520, chartWidth = 580, chartHeight = 200;
    const barAreaWidth = chartWidth / N;

    // Axes
    ctx.beginPath();
    ctx.moveTo(chartX, chartY);
    ctx.lineTo(chartX + chartWidth, chartY);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Y-axis labels
    ctx.fillStyle = '#333';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Miss', chartX - 10, chartY + chartHeight);
    ctx.fillText('Tuck', chartX - 10, chartY + chartHeight * 0.5);
    ctx.fillText('Knit', chartX - 10, chartY + 5);

    // Bar group for each feed
    for (let i = 0; i < N; i++) {
        const feed = data.feeds[i];
        const xCenter = chartX + barAreaWidth * i + barAreaWidth / 2;

        // Cylinder bar (blue)
        drawBar(xCenter - 12, chartY, chartHeight, feed.cylinder, '#3498db');
        // Dial bar (orange) if present
        if (data.type === 'double' && feed.dial) {
            drawBar(xCenter + 12, chartY, chartHeight, feed.dial, '#e67e22');
        }

        // Feed label
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`F${i + 1}`, xCenter, chartY + chartHeight + 20);
    }

    // Title
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Cam Height per Feed (Linear Graph)', 350, chartY - 15);
}

function drawBar(x, baseY, maxHeight, camType, color) {
    let height = 0;
    if (camType === 'knit') height = maxHeight * 0.9;
    else if (camType === 'tuck') height = maxHeight * 0.45;
    else height = 0;   // miss

    const y = baseY + maxHeight - height;
    ctx.fillStyle = color;
    ctx.fillRect(x - 8, y, 16, height);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - 8, y, 16, height);
}
