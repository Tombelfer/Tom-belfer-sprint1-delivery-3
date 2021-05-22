'use strict'
const MINE = '💣'
const EMPTY = ''
const FLAG = '🚩'
const LIVE = '❤️'
const BUTTON = '<button class="btn-field"> </button>';


var gBoard
var gGame = {
    level: 0,
    isManual: false,
    isOn: true,
    hintIsOn: false,
    safeClicks: 0,
    shownCount: 0,
    secsPassed: 0,
    cellsMarked: 0,
    cellsClicked: 0,
    life: 0,
    size: 0,
    unShownMines: 0,

}
var gTimeInterval
var gElSmile = document.querySelector(".smile")

var gLevels = [
    { size: 4, mines: 2, life: 2, safe: 3 },
    { size: 8, mines: 12, life: 2, safe: 3 },
    { size: 12, mines: 30, life: 3, safe: 3 }
]


function initGame(level = 0) {
    // if(isManual) 
    resetGame(level)
    renderSafeButton()
    document.querySelector(".smile").innerText = '🙂'
    gBoard = buildBoard(gLevels[level])
    renderBoard(gBoard, '.board-container')
    renderLife(gLevels[level])

}
function buildBoard(level = 0) {
    var board = []
    for (var i = 0; i < level.size; i++) {
        board[i] = []
        for (var j = 0; j < level.size; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }
    setMinesOnBoard(gGame.unShownMines, board)
    setMinesNegsCount(board)
    return board
}
function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            board[i][j].minesAroundCount = countNeighbors(i, j, board)
        }
    }
}
function renderBoard(board, selector) {
    var strHTML = '<table border="1"><tbody>';
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < board[0].length; j++) {
            var cell = (board[i][j].isMarked) ?
                FLAG :
                (!board[i][j].isShown) ? BUTTON :
                    (board[i][j].isMine) ? MINE : (board[i][j].minesAroundCount === 0) ?
                        EMPTY : board[i][j].minesAroundCount;
            var className = 'cell cell' + i + '-' + j;
            // var dataId = `data-i="${i}" data-j="${j}"`;  ${dataId}
            strHTML += `<td class="${className}" onClick="cellClicked(this,${i},${j})" oncontextmenu="cellMarked(this,${i},${j})"> ${cell} </td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}
function cellClicked(elCell, i, j) {
    if(gGame.cellsClicked===0){
        gGame.isOn=true
    }
    // if(isManual){
    // setMenualMines(elCell, i, j)
    // }else{
    setMenualMines()

    if (!gGame.isOn && gGame.shownCount > 0) return
    gGame.cellsClicked++
    if (gGame.cellsClicked === 1) {
        gTimeInterval = setInterval(() => {
            timer()
        }, 1000);
    }
    var dataCell = gBoard[i][j]
    if (dataCell.isMarked) return
    if (dataCell.isShown) return
    if (gGame.hintIsOn) {
        hintAroundCell(elCell, i, j)
        return
    }
    if (dataCell.minesAroundCount) {
        renderCell({ i, j }, dataCell.minesAroundCount)
        gGame.shownCount++
    } else renderCell({ i, j }, EMPTY)

    //in case of mine clicked
    if (dataCell.isMine) {
        gElSmile.innerText = '🤯'
        gGame.shownCount++
        gGame.unShownMines--
        if (!gGame.shownCount > 0) {
            onFirstClick({ i, j }, dataCell)
        } else {
            dataCell.isShown = true
            gGame.life--
            elCell.innerHTML = MINE
            if (gGame.life === 0) checkGameOver(true)
            renderLife()
        }
    }
    // in case of non mind clicked
    if (gBoard[i][j].minesAroundCount === 0) {
        expandShown(gBoard, i, j)
        dataCell.isShown = true
    }
    elCell.classList.add('shown')
    dataCell.isShown = true

    checkGameOver()
}
function renderLife() {
    var elLives = document.querySelector('.life');
    var strHTML = LIVE.repeat(gGame.life);
    elLives.innerText = 'LIVES:' + strHTML;
}
function expandShown(board, cellI, cellJ) {
    var elNegsCell
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= board.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            // if (i === cellI && j === cellJ) continue;
            if (j < 0 || j >= board[i].length) continue;
            elNegsCell = document.querySelector(`.cell${i}-${j}`)
            if (elNegsCell.innerHTML === `${FLAG}`) {
                continue
            }
            if (board[i][j].isShown) continue
            if (board[i][j].minesAroundCount !== 0) {
                renderCell({ i, j }, board[i][j].minesAroundCount)
                board[i][j].isShown = true
                if (!board[i][j].isMine) {
                    gGame.shownCount++
                }
            }
            if (board[i][j].minesAroundCount === 0 &&
                !board[i][j].isShown &&
                !board[i][j].isMine) {
                if (!board[i][j].isMine) {
                    gGame.shownCount++
                }
                board[i][j].isShown = true
                renderCell({ i, j }, EMPTY)
                expandShown(board, i, j)
            }
            var elNegsCell = document.querySelector(`.cell${i}-${j}`)
            elNegsCell.classList.add('shown')
        }
    }
}
function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    var dataCell = gBoard[i][j]
    if (!dataCell.isShown) {
        if (dataCell.isMarked) {
            dataCell.isMarked = false
            elCell.innerHTML = BUTTON
            gGame.cellsMarked--

        } else {
            dataCell.isMarked = true
            elCell.innerHTML = FLAG
            gGame.cellsMarked++
        }
    }
    checkGameOver()
}
function checkGameOver(isDead) {

    if (isDead) {

        gameOver(false)
    }
    else if (gGame.isOn) {
        for (var i = 0; i < gBoard.length; i++) {
            for (var j = 0; j < gBoard[0].length; j++) {
                var dataCell = gBoard[i][j]
                if (!dataCell.isShown && !dataCell.isMine)
                    return
            }
        } if (gGame.cellsMarked === gGame.unShownMines) {
            gGame.isOn = false
            gameOver(true)
        }
    }
}
function gameOver(isWin) {
    stopTimer()
    gGame.isOn = false
    if (isWin) {
        gElSmile.innerText = '😎'
    } else {
        renderFlags();
        gElSmile.innerText = '🤯'
    }
}
function setMinesOnBoard(mines, board) {
    for (var i = 0; i < mines; i++) {
        var cell = {
            i: getRandomInt(0, board.length),
            j: getRandomInt(0, board[0].length)
        }

        board[cell.i][cell.j].isMine = (!board[cell.i][cell.j].isMine) ? true : setMinesOnBoard(1, gBoard)
    }

}
function timer() {
    gGame.secsPassed++
    var x = document.querySelector('.timer')
    x.innerHTML = `Timer: ${gGame.secsPassed} sec`
}
function stopTimer() {
    clearInterval(gTimeInterval)
}
function onFirstClick(cell, dataCell) {
    dataCell.isMine = false
    setMinesOnBoard(1, gBoard);
    setMinesNegsCount(gBoard);
    expandShown(gBoard, cell.i, cell.j)
}
function resetGame(level = 0) {
    clearInterval(gTimeInterval)
    gGame = {
        level: level,
        isOn: false,
        hintIsOn: false,
        safeIsOn: false,
        shownCount: 0,
        secsPassed: 0,
        cellsMarked: 0,
        cellsClicked: 0,
        safeClicks: gLevels[level].safe,
        life: gLevels[level].life,
        size: gLevels[level].size,
        unShownMines: gLevels[level].mines
    }
}
function renderFlags() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (gBoard[i][j].isMine) {
                var cell = document.querySelector(`.cell${i}-${j}`)
                cell.innerHTML = `${FLAG}`
                cell.classList.add('shown')
            }
        }
    }
}
function showSafe(elSafeBtn) {
    if (gGame.isOn && gGame.safeClicks > 0) {
        gGame.safeIsOn = true
        var i = getRandomInt(0, gBoard.length)
        var j = (getRandomInt(0, gBoard[0].length))
        var elCell = document.querySelector(`.cell${i}-${j} .btn-field`)
        if (!gBoard[i][j].isMine && !gBoard[i][j].isShown) {
            var count = 0
            var blinkInter = setInterval(() => {
                elCell.style.backgroundColor = 'orange'
                setTimeout(() => {
                    elCell.style.backgroundColor = '#2b2222bf'
                }, 150);
                count++
                if (count === 3) clearInterval(blinkInter)
            }, 300);
            gGame.safeClicks--

            if (gGame.safeClicks > 0) renderSafeButton()
            else elSafeBtn.innerText = 'Safe-button'
        } else showSafe(elSafeBtn)
        gGame.safeIsOn = false
    }

}
function renderSafeButton() {
    document.querySelector('.safe').innerText = `Safe-button x ${gGame.safeClicks}`
}

function hintAroundCell(elCell, i, j) {

    console.log(elCell)
}
function setMenualMines() {
    var x = document.querySelector(".check-manuael");
}
window.oncontextmenu = (e) => {
    e.preventDefault();
}