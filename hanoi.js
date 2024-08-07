//For visualization
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext('2d');
const diskInput = document.getElementById("disks");
const speedInput = document.getElementById("speed");

//Store the animation stack
let animations = [];
let speed = 150;
let delay = 80;

//Program parameters
let visualizing = false;
let prev;
let sequenceDisplay = "";
let displayMoveNum = 0;

//Counting moves
let moves = 0;
let moveList = [];

//Disk parameters
const diskH = 20; //Height
let disks = 3; //#

//Tower parameters
const poleW = 10; //Width
const poleH = 200; //Height
let poleP = [
    { 
        x: 200, 
        y: canvas.height / 2 - poleH / 2 - 20, 
        disks: Array.from({ length: disks }, (_, i) => disks - i) 
    },
    { 
        x: 500, 
        y: canvas.height / 2 - poleH / 2 - 20, 
        disks: [] 
    },
    { 
        x: 800, 
        y: canvas.height / 2 - poleH / 2 - 20, 
        disks: [] 
    }
];

//3 nested arrays representing the 3 poles (ordered in bottom -> top)
let poles = [Array.from({length: disks}, (_, i) => disks - i), [], []]

//Draw poles
function drawPoles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    poleP.forEach((pole, i) => {
        //Draw the tower
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.roundRect(pole.x - poleW / 2, pole.y, poleW, poleH, 5);
        ctx.stroke();
        ctx.fill();
        
        ctx.fillStyle = "black";
        ctx.font = "20px monospace";
        ctx.fillText(i + 1, pole.x - 7, pole.y + poleH + 50);
        
        //Draw the disks on each pole
        pole.disks.forEach((disk, i) => {
            const diskWidth = disk * 20;
            const x = pole.x - diskWidth / 2;
            const y = pole.y + poleH - (i + 1) * diskH;
            
            ctx.beginPath();
            ctx.fillStyle = `hsl(${disk * 35}, 100%, 50%)`;
            ctx.roundRect(x, y, diskWidth, diskH, 5);
            ctx.fill();
            ctx.stroke();
        });
    });
}

//Setup disks
function animateDisk(from, to) {
    //Calculate where the disk moves
    const disk = poleP[from - 1].disks.pop();
    const startX = poleP[from - 1].x;
    const endX = poleP[to - 1].x;
    const startY = poleP[from - 1].y + poleH - (poleP[from - 1].disks.length + 1) * diskH;
    const endY = poleP[to - 1].y + poleH - (poleP[to - 1].disks.length + 1) * diskH;
    
    const diskWidth = disk * 20;
    let currentY = startY;
    let currentX = startX;
    const riseHeight = 30;
    const s = speed;

    //Save
    animations.push({
        disk,
        currentX,
        currentY,
        startX,
        endX,
        startY,
        endY,
        diskWidth,
        riseHeight,
        speed: s,
        from: from - 1,
        to: to - 1,
        complete: false
    });
}

//Move disks
function update() {
    //Update the disks
    animations = animations.filter((animation) => {
        const { disk, currentX, currentY, startX, endX, startY, endY, diskWidth, riseHeight, speed, from, to } = animation;

        //Is the disk still on the pole?
        if (currentY > poleP[from].y - riseHeight && currentX === startX) {
            animation.currentY -= speed;
        } else if (currentX !== endX) { //Is the disk moving to another pole?
            animation.currentX += (endX > startX ? speed : -speed);
        } else if (currentY < endY) { //Is the disk on the ending pole?
            animation.currentY += speed;
        } else {
            poleP[to].disks.push(disk);
            animation.complete = true;
            return false;
        }

        return true;
    });
    
    drawPoles();
    
    //Draw the disks
    animations.forEach((animation) => {
        const { disk, currentX, currentY, diskWidth } = animation;
        ctx.beginPath();
        ctx.fillStyle = `hsl(${disk * 60}, 100%, 50%)`;
        ctx.roundRect(currentX - diskWidth / 2, currentY, diskWidth, diskH, 5);
        ctx.fill();
        ctx.stroke();
    });

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(sequenceDisplay, 10, 30);

    requestAnimationFrame(update);
}

//Solving helper function
function solve(skip) {
    if (visualizing) return;
    
    poles = [Array.from({length: disks}, (_, i) => disks - i), [], []]
    moves = 0;
    moveList = [];
    hanoi(disks, 1, 2);
    console.log(`%cTotal Moves: ${moves}`, "color:red;");
    console.log(`%cVisualization Time: ~${moves * delay}ms`, "color:red;");
    if (!skip) alert(`Solved in ${moves} moves. Check console for sequences.`);
}

//Editing parameters helper function (discs)
function edit() {
    if (Number(diskInput.value) < 1 && diskInput.value != "") diskInput.value = 1;
    if (isNaN(Number(diskInput.value))) {
        diskInput.value = prev;
        console.log("what the sigma");
    }
    if (visualizing) {
        diskInput.value = prev;
        return;
    }

    moves = 0;
    moveList = [];

    reset();

    prev = diskInput.value;
}

//Resetting helper function;
function reset() {
    sequenceDisplay = "";
    displayMoveNum = 0;
    disks = Number(diskInput.value);
    poleP = [
        { 
            x: 200, 
            y: canvas.height / 2 - poleH / 2 - 20, 
            disks: Array.from({ length: disks }, (_, i) => disks - i) 
        },
        { 
            x: 500, 
            y: canvas.height / 2 - poleH / 2 - 20, 
            disks: [] 
        },
        { 
            x: 800, 
            y: canvas.height / 2 - poleH / 2 - 20, 
            disks: [] 
        }
    ];
}

//Visualization helper function
async function visualize() {
    if (visualizing) return;

    //Reset
    reset();

    //Only solve if it hadn't been solved yet
    if (!moveList.length) solve(true);

    visualizing = true;
    for (sequence of moveList) {
        const from = sequence[0];
        const to = sequence[1];

        displayMoveNum++;

        sequenceDisplay = "#" + displayMoveNum + ". " + from + " -> " + to;
        
        animateDisk(from, to);

        await wait(delay);
    }

    visualizing = false;
    sequenceDisplay = "#" + (displayMoveNum + 1) + ". " + "Solved";
}

//Wait helper function
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

//Call draw loop
update();


//Moving function
function move(fromPole, toPole) {
    //Update # of moves
    moves++;

    moveList.push([fromPole, toPole])

    //Get pole's last element (zero-index'd)
    const pole = poles[fromPole - 1];
    const disk = pole[pole.length - 1];

    //Log move lol
    const colors = ["grey", "grey", "grey"];
    console.log("%c" + fromPole + "%c -> " + "%c" + toPole, `color: ${colors[fromPole-1]};`, `color: grey;`, `color: ${colors[toPole-1]};`)

    //Delete it and add it to the desired pole
    pole.pop();
    poles[toPole - 1].push(disk);
}

//1. Move the pile of disks - 1 to the spare pole
//2. Move the biggest disk to the desired pole
//3. Move the pile of disks - 1 back to the desired pole

//Recurion helps by solving the initial problems of moving a pile of 1, 2, 3...
//However, the spare pole must thus alternate
//This is as achieving the stack pile (disk - 1) must first result in using the other pole

//Recursive solving function
function hanoi(disks, startingPole, endingPole) {
    //Is the problem only moving 1 disk?
    if (disks == 1) {
        //If so, simply move that disk to the desired pole
        move(startingPole, endingPole)
        return;
    }

    //Get the alternating spare pole (pole that isn't either starting or ending) 
    const sparePole = 6 - (startingPole + endingPole);

    //Move the pile of disks- 1 to the spare pole
    hanoi(disks - 1, startingPole, sparePole);

    //Actually move the biggest disk
    move(startingPole, endingPole);

    //Move the pile of disks - 1 back to the desired
    hanoi(disks - 1, sparePole, endingPole) 
}