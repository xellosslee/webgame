// Create PIXI apllicaion (OpenGL)
const app = new PIXI.Application({
    resizeTo: window
})

// app.view is default black panel
document.body.appendChild(app.view)
const { stage } = app

const graphics = new PIXI.Graphics()
const preShapeMagic = new PIXI.Graphics()
const drawInterval = 10
const calcInterval = 5

stage.addChild(preShapeMagic)
stage.addChild(graphics)

// set a fill and line style
// 그려야할 마법의 모양을 배경으로 그려준다 (튜토리얼 & 디버깅에 사용)
preShapeMagic.lineStyle(fire1.difficult*2, 0xFF0000, 0.5)
for(let i = 0 ; i < fire1.shape.length; i+=2) {
    if(i == 0)
        preShapeMagic.moveTo(fire1.shape[i], fire1.shape[i+1])
    else
        preShapeMagic.lineTo(fire1.shape[i], fire1.shape[i+1])
}
preShapeMagic.closePath()
preShapeMagic.endFill()

app.loader.load(setup)

//app.window = app;
// app 전역 화면에서 터치 먹도록 설정
app.renderer.plugins.interaction.on('pointerdown', pointerDown)
app.renderer.plugins.interaction.on('pointerup', pointerUp)
app.renderer.plugins.interaction.on('pointermove', pointerMove)
app.renderer.plugins.interaction.on('touchdown', pointerDown)
app.renderer.plugins.interaction.on('touchup', pointerUp)
app.renderer.plugins.interaction.on('touchmove', pointerMove)

var dragging = false
var clickPosition = undefined

function pointerDown(event) {
    console.log(`pointerDown x : ${event.data.global.x} y : ${event.data.global.y}`)
    dragging = true
    if(clickPosition === undefined) {
        // set a line style
        graphics.lineStyle(1, 0xFFFFFF, 1, 0, true)
        graphics.moveTo(event.data.global.x, event.data.global.y)
        clickPosition = {x:event.data.global.x, y:event.data.global.y}
    }
    pointerMove(event)
}

function pointerUp(event) {
    dragging = false
    clickPosition = undefined
    //graphics.geometry.graphicsData
    let percent = calcPercentMatch(fire1, graphics.geometry.graphicsData)
    if(percent == -1)
        alert(`Too short`)
    else
        alert(`${percent}% match`)
    graphics.clear()
    console.log(`pointerUp`)
}

function pointerMove(event) {
    // console.log(`clickPosition x ${clickPosition.x} y ${clickPosition.y} pointerMove x ${event.data.global.x} y ${event.data.global.y}`)
    if (dragging && 
        (   clickPosition.x <= event.data.global.x - drawInterval ||
            clickPosition.x >= event.data.global.x + drawInterval ||
            clickPosition.y <= event.data.global.y - drawInterval ||
            clickPosition.y >= event.data.global.y + drawInterval 
        )) {
        graphics.lineStyle(1, Math.random() * 0xFFFFFF, 1, 0, true)
        graphics.moveTo(clickPosition.x, clickPosition.y)
        graphics.lineTo(event.data.global.x, event.data.global.y)
        clickPosition = {x:event.data.global.x, y:event.data.global.y}
    }
}
function setup(loader, resources) {
    stage.interactive = true
}

function calcPercentMatch(spell, drawLines) {
    if (drawLines.length <= 10)
        return -1;
    let match = 0
    let miss = 0

    for(let j = 0; j < drawLines.length; j++) {
        let bestResult = {match:0,miss:5}
        for(let i = 0; i < spell.shape.length;i+=2) {
            
            let boundsSpell = rect(spell.shape[i] - spell.difficult, spell.shape[i+1] - spell.difficult,
                spell.shape[i+2] + spell.difficult, spell.shape[i+3] + spell.difficult)

            let boundsDraw = rect(drawLines[j].points[0], drawLines[j].points[1], drawLines[j].points[2], drawLines[j].points[3])
            let result = calcBounds(boundsSpell, boundsDraw)
            if(result.match == calcInterval) {
                bestResult = result
                break
            } else if (bestResult.match < result.match) {
                bestResult = {match:result.match,miss:result.miss}
            } else if(result.miss == calcInterval) {
                // debugger
            }
        }
        match += bestResult.match
        miss += bestResult.miss
    }
    return (match / (match+miss)) * 100
}

function rect(minX,minY,maxX,maxY) {
    return {minX:minX,minY:minY,maxX:maxX,maxY:maxY}
}
/* Example
50 50 250 50 // spell 객체의 예시 
53 48 62 52 // draw 객체의 예시

65 52 53 48 // 반대방향으로 그릴때의 연산도 상관없음! 더하기가 되든 빼기가 되든 이상없이 동작함

53에서 62까지 더하고
48에서 52까지 더하면서

50 50 250 50 박스에서 벗어나는 횟수와 박스 내에 들어가는 횟수를 계산해야 함

62 - 53 = 9
52 - 48 = 4

이동 경로에 따라서 + 가 될수도 있고 - 가 될수도 있음 하지만, 계산식에서는 이동경로에 대한 point를 가져오면 되므로 

별도로 calcInterval 변수를 만들어서 우선 drawInterval과 동일하게 5로 맞춰놓고 사용

53 + (9/5)
48 + (4/5)
그럼 1/5씩 증가시켜서 해당 point 가 박스안에 들어가는 횟수만큼 matchPoint를 증가시키고 
박스밖으로 벗어나는 만큼 missPoint를 증가
 */
function calcBounds(rectBase, rectCheck) {
    let x = rectCheck.minX
    let y = rectCheck.minY
    let intervalX = rectCheck.maxX - rectCheck.minX
    let intervalY = rectCheck.maxY - rectCheck.minY

    let result = {match: 0, miss: 0}
    for(let i = 0 ; i < calcInterval ; i++) {
        if(rectBase.minX <= x && rectBase.maxX >= x && rectBase.minY <= y && rectBase.maxY >= y) {
            result.match++
        } else {
            result.miss++
        }
        // if(calcInterval-1 == i) { // 소수점이 밖으로 벗어나는 경우도 있을까봐 코딩은 해두지만, 아마 그런일을 없을듯 (벗어나더라도 bounds 내에 존재할듯)
        //     x += Math.round(intervalX / calcInterval)
        //     y += Math.round(intervalY / calcInterval)
        // } else {
            x += (intervalX / calcInterval)
            y += (intervalY / calcInterval)
        // }
    }

    return result
}