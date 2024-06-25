// Lägg in din anmälningskod här: 
// Skriv ditt namn här: Linn Agerhem
// Använda verktyg och tjänster: VSC, nodeJS, npm, Kodexempel från föreläsningar/workshops
'use strict';
const express = require('express');
const app = express();
const http = require('http').createServer(app);//från workshop 2 med Pierre
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const jsDOM = require('jsdom');
const fs = require('fs');
const game = require('./resources/game.js');  //heter game pga så den kallas i färdiga funktioner från startkod
const playerJS = require('./resources/player.js')
const utilsJS = require('./resources/utils.js');


let portNr = 3000;//portnummer som variabel för att förenkla ändring
/*Från workshop 2, 
 * skapar server som även sockets kommer åt.
*/
let server = http.listen(portNr, () => {
    console.log("Server körs på port: " + portNr);
});

//middlewares för tolkning av kakor, öppning av mappen clientCode och tolkning av formulärdata
//Taget från kodexempel f4 och dubbelkollat att krypteringstyp stämmer samt ändrat mappnamn
app.use(cookieParser());
app.use('/public', express.static(__dirname + '/clientCode'));
app.use(express.urlencoded({ extended: true })); //innehåll i detta från html-formulär

app.get('/', (req, res) => {
    //struktur för readfile med if-sats för error från workshop 1
    fs.readFile(__dirname + '/resources/basepage.html', (error, data) => {
        if (error) {
            console.log(error);
            res.send(error);
        } else {
            let virDOM = new jsDOM.JSDOM(data);//från workshop 1, men eget variabelnamn
            fs.readFile(__dirname + '/resources/register-form.html', (error2, data2) => {
                if (error2) {
                    console.log(error2);
                    res.send(error2);
                } else {
                    let main = virDOM.window.document.querySelector('main');
                    main.innerHTML = data2;
                    let form = virDOM.window.document.querySelector('form');
                    let formDivs = virDOM.window.document.querySelectorAll('form>div');
                    let div = virDOM.window.document.createElement('div');
                    let checkBox = virDOM.window.document.createElement('input');
                    let label = virDOM.window.document.createElement('label');
                    checkBox.setAttribute('type', 'checkbox');
                    checkBox.setAttribute('id', 'increaseSpeed');
                    checkBox.setAttribute('name', 'increaseSpeed');
                    label.setAttribute('for', 'increaseSpeed');
                    label.textContent = 'Öka bollens fart var 10:e sekund';
                    label.setAttribute('style', 'padding: 0.1rem;');
                    div.classList.add('text-right');
                    div.appendChild(checkBox);
                    div.appendChild(label);
                    form.insertBefore(div, formDivs[2]);
                    data = virDOM.serialize();
                    res.send(data);
                }
            });
        }
    });
});
app.post('/play', (req, res) => {
    let nickname = req.body.nickname;
    let speed = req.body.speed;
    let incSpeed = req.body.increaseSpeed;
    try {
        if (nickname === undefined) {
            throw {
                felM: 'Nickname måste finnas!'
            }
        }
        if (speed === undefined) {
            throw {
                felM: 'Speed måste finnas!'
            }
        }
        if (nickname.length < 6) {
            throw {
                felM: 'Nickname måste vara minst 6 tecken!'
            }
        }
        if (!utilsJS.isNumber(speed)) {
            throw {
                felM: 'Speed måste vara ett tal!'
            }
        }
        if (!(1 <= speed && speed <= 5)) {
            throw {
                felM: 'Speed måste vara mellan 1 och 5!'
            }
        }
        if (playerJS.playerOneNick != null) {
            if (nickname === playerJS.playerOneNick) {
                throw {
                    felM: 'Du får inte ha samma nick som den andra spelaren!'
                }
            }
        }
        if (playerJS.playerOneNick == null) {
            playerJS.playerOneNick = nickname;
            playerJS.playerOneSpeed = speed;
            console.log(nickname, speed);
            if (incSpeed == 'on') {
                playerJS.playerOneEnableSpeed = true;
            }
            res.cookie('player', 1, { maxAge: 1000 * 60 * 60 });
        } else if (playerJS.playerTwoNick == null) {
            playerJS.playerTwoNick = nickname;
            playerJS.playerTwoSpeed = speed;
            console.log(nickname, speed);
            if (incSpeed == 'on') {
                playerJS.playerTwoEnableSpeed = true;
            }
            res.cookie('player', 2, { maxAge: 1000 * 60 * 60 });
        }
        fs.readFile(__dirname + '/resources/basepage.html', (error, data) => {
            if (error) {
                console.log(error);
                res.send(error);
            } else {
                let virDOM = new jsDOM.JSDOM(data);
                let main = virDOM.window.document.querySelector('main');
                main.innerHTML = '<h1>Väntar på spelare</h1><div class="spinner-border text-muted"></div>';
                data = virDOM.serialize();
                res.send(data);
            }
        });
    } catch (oFel) {
        fs.readFile(__dirname + '/resources/basepage.html', (error, data) => {
            if (error) {
                console.log(error);
                res.send(error);
            } else {
                let virDOM = new jsDOM.JSDOM(data);
                fs.readFile(__dirname + '/resources/register-form.html', (error2, data2) => {
                    if (error2) {
                        console.log(error2);
                        res.send(error2);
                    } else {
                        virDOM.window.document.querySelector('main').innerHTML = data2;
                        let form = virDOM.window.document.querySelector('form');
                        let formDivs = virDOM.window.document.querySelectorAll('form>div');
                        let div = virDOM.window.document.createElement('div');
                        let checkBox = virDOM.window.document.createElement('input');
                        let label = virDOM.window.document.createElement('label');
                        checkBox.setAttribute('type', 'checkbox');
                        checkBox.setAttribute('id', 'increaseSpeed');
                        checkBox.setAttribute('name', 'increaseSpeed');
                        label.setAttribute('for', 'increaseSpeed');
                        label.textContent = 'Öka bollens fart var 10:e sekund';
                        label.setAttribute('style', 'padding: 0.1rem;');
                        div.classList.add('text-right');
                        div.appendChild(checkBox);
                        div.appendChild(label);
                        form.insertBefore(div, formDivs[2]);
                        virDOM.window.document.querySelector('#error').textContent = oFel.felM;
                        if (nickname != null) {
                            virDOM.window.document.querySelector('#nickname').setAttribute('value', nickname);
                        }
                        if (speed != null) {
                            virDOM.window.document.querySelector('#speed').setAttribute('value', speed);
                        }
                        if (incSpeed == 'on') {
                            checkBox.setAttribute('checked', true);
                        }
                        data = virDOM.serialize();
                        res.send(data);
                    }
                });
            }
        });
    }
});

io.on('connection', (socket) => {
    console.log('Ny anv på socket');
    console.log(playerJS.playerOneSocketId, playerJS.playerTwoSocketId);
    let cookieString = socket.handshake.headers.cookie;
    let cookieObj = utilsJS.parseCookies(cookieString);
    if (cookieObj.player != null) {
        if (cookieObj.player == 1) {
            playerJS.playerOneSocketId = socket.id;
        } else if (cookieObj.player == 2) {
            playerJS.playerTwoSocketId = socket.id;
        }
    }
    console.log("efter if-sats", playerJS.playerOneSocketId, playerJS.playerTwoSocketId);
    if (playerJS.playerOneSocketId != null && playerJS.playerTwoSocketId != null) {
        if (playerJS.playerOneNick != null && playerJS.playerTwoNick != null) {
            //fel pga playerOneSpeed och playerTwoSpeed är string inte tal, eg 5+5=55, hade behövts göras en parseInt på invärdena
            game.timeInterval = 80 - ((playerJS.playerOneSpeed + playerJS.playerTwoSpeed) * 10); 
            io.to(playerJS.playerOneSocketId).emit('startgame', { "currentnick": playerJS.playerOneNick, "opponentnick": playerJS.playerTwoNick, "player": 'left' });
            io.to(playerJS.playerTwoSocketId).emit('startgame', { "currentnick": playerJS.playerTwoNick, "opponentnick": playerJS.playerOneNick, "player": 'right' });
            if (playerJS.playerOneEnableSpeed === true && playerJS.playerTwoEnableSpeed === true) {
                game.increaseSpeedEnabled = true;
                game.increaseSpeed();
            }
            game.timerId = setTimeout(timeout, game.timeInterval);//parametrar för setTimeout från game.js ;)
        }
    }

    //Lyssnar efter och skickar vidare uppdaterad position av padel
    socket.on('updatePadPos', (data) => {
        socket.broadcast.emit('updatePadPos', { "Y": data });
    });

    //Ta emot changedirection-händelse från klient
    socket.on('changedirection', function () {
        if (game.directionLock < 0) {
            game.deltaX = game.deltaX * -1;
            //lägg på lås så inte riktning ändras igen inom 5 positionsuppdateringar.
            game.directionLock = 5;
        }
    });

    //Funktion för att beräkna bollens rörelse
    function timeout() {
        //uppdatera ballposition
        game.ballX = game.ballX + game.deltaX;
        game.ballY = game.ballY + game.deltaY;
        game.directionLock--;

        //Kontrollera krock nedåt,uppåt
        if (game.ballY <= 0 || game.ballY >= 480) {
            game.deltaY = game.deltaY * -1;
            io.emit('ping', null);
        }
        io.emit('updateball', { 'xpos': game.ballX, 'ypos': game.ballY });
        //Ropa på funktion för att kontrollera om spelet är slut
        checkForGameOver();
    }

    //Funktion för att kolla om spelet är avgjort
    function checkForGameOver() {
        if (game.ballX <= 0 || game.ballX >= 790) {
            if (game.ballX <= 0) {
                //player one förlorar
                io.emit('gameover', { "winner": playerJS.playerTwoNick });
            } else {
                //player two förlorar
                io.emit('gameover', { "winner": playerJS.playerOneNick });
            }
            game.reset();
            playerJS.reset();
        } else {
            //clearTimeout behövs ej här då timeout funktionen redan har nått noll
            clearTimeout(game.timerId);
            game.timerId = setTimeout(timeout, game.timeInterval);
        }
    }

});


