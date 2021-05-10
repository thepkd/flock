var boidArr = [];
var obstacleArr = [];

// Distance Settings
var friendDistance = 3;
var obstacleDistance = 3;
var coheseDistance = 2.5;

//Control Parameters
var globalFactor = 1;
var timeFactor = 0.08;
var worldFactor = 20;
var wallX = worldFactor; var wallY= worldFactor; var wallZ= worldFactor;

// Togglers
var bAvoid = 1;
var oAvoid = 0;        // Toggling obstacle Avoidance
var velocityMatch = 0; // Turning vMatchReq on/off
var cohese = 0;        // Toggling coheseVelReq
var randMove = 1;      // Toggling random motion
var inertia = 1;

// Variable Factors to the velReqs
var obstAccFactor = 3; // Same for bAvoid and oAvoid
var oAvoidFactor = 3;
var velMatchFactor = 1.5;
var coheseFactor = 0.7;
var randFactor = 0.1;

//Velocity Capping 
var velReqCap = 4;
var inertiaCap = 1;

class Obstacle{
    constructor(){
        this.center = vec3.fromValues(0.5,0.5,0.5);
        this.translation = vec3.fromValues(0,0,0);
        this.xAxis = vec3.fromValues(1,0,0);
        this.yAxis = vec3.fromValues(0,1,0);
        this.color = vec3.fromValues(255,0,0);
        this.isHighlighted = 0;
    }
}

class  Boid {
    static maxVelocity = 2;
    constructor(){
        this.position = vec3.fromValues(0,0,0);
        this.velocity = vec3.fromValues(0,0,-1);
        this.center = vec3.fromValues(0.5,0.5,0.5);
        this.xAxis = vec3.fromValues(1,0,0);
        this.yAxis = vec3.fromValues(0,1,0);
        this.translation = vec3.fromValues(5,5,5);
        var friends = new Array();
        var obstacles = new Array();
        this.friendsIndex = friends;
        this.obstaclesIndex = obstacles;
        this.counter = 0;
    }
    addTranslate(x,y,z){
        vec3.add(this.translation,this.translation, vec3.fromValues(x,y,z));
        //console.log(this.translation);
    }

    addVelocity(x,y,z){
        vec3.add(this.velocity, this.velocity, vec3.fromValues(x,y,z));
    }

    setVelocity(x,y,z){
        vec3.set(this.velocity,x,y,z);
    }

    resetTranslation(x,y,z){
        vec3.set(this.translation,0,0,0);
    }

    incrementCounter(){
        this.counter += 1;;
    }

    findFriends(){//Friends are Flock Members in the vicinity
        for(let i=0; i<boidArr.length; i++){
            var distanceBetweenCenters = vec3.distance(this.translation, boidArr[i].translation);
            if(distanceBetweenCenters > 0 && distanceBetweenCenters<friendDistance){
                this.friendsIndex = [];
                this.friendsIndex.push(i);
            }
        }
    }

    findFoes(){  //Foes are Obstacles in the vicinity
        this.obstaclesIndex = [];
        for(let j=0; j<obstacleArr.length; j++){
            var distanceBetweenCenters = vec3.distance(this.translation, obstacleArr[j].translation);
            if(distanceBetweenCenters<obstacleDistance){
                this.obstaclesIndex.push(j);
            }
        }
    }

    modifyXY(){ // Rotate Model towards veloacity by modifying X and Y axes
        //Find cos inverse of (0,0,1) & (x,0,z) where x,y,z are component of boid.Velocity: vec3(x,y,z)
        //console.log(this.xAxis, this.yAxis);
        var toDir = vec3.fromValues(0,0,0); toDir = vec3.copy(toDir,this.velocity);
        vec3.normalize(toDir, toDir);
        var xzVector = vec3.fromValues(toDir[0], 0, toDir[2]);
        vec3.normalize(xzVector, xzVector);
        //console.log(toDir);
        var angleYRad = retTheta(vec3.fromValues(0,0,1), xzVector);
        if(toDir[0]<0) angleYRad = -angleYRad;
        var angleXRad;
        if(angleYRad==0)
            angleXRad = retTheta(vec3.fromValues(0,0,1), toDir);
        else
            angleXRad = retTheta(xzVector, toDir);

        if(toDir[1]>0) angleXRad = -angleXRad;
        //console.log(angleXRad + " " + angleYRad);

        var z = vec3.fromValues(0,0,0); vec3.cross(z, this.xAxis, this.yAxis);
        //console.log(this.xAxis, this.yAxis,z);
        var newRotation = mat4.create();
        mat4.fromRotation(newRotation,angleYRad , vec3.fromValues(0,1,0)); // get a rotation matrix around passed axis
        //console.log(newRotation);
        vec3.transformMat4(this.xAxis,vec3.fromValues(1,0,0),newRotation); // rotate model x axis tip
        vec3.transformMat4(this.yAxis,vec3.fromValues(0,1,0),newRotation); // rotate model y axis tip
        //console.log(this.xAxis, this.yAxis);
        //this.xAxis = vec3.fromValues(-1,0,1);
        //this.yAxis = vec3.fromValues(0,1,0);
        var z1 = vec3.fromValues(0,0,0); vec3.cross(z1, this.xAxis, this.yAxis);
        //console.log(this.xAxis, this.yAxis ,z1);

        var newRotation2 = mat4.create();
        mat4.fromRotation(newRotation2,angleXRad , this.xAxis); // get a rotation matrix around passed axis
        vec3.transformMat4(this.xAxis,this.xAxis,newRotation2); // rotate model x axis tip
        vec3.transformMat4(this.yAxis,this.yAxis,newRotation2); // rotate model x axis tip
        //console.log(this.xAxis, this.yAxis);
    }
}

function loadBoid(){
    var block;
    //Load Type 1 block at vertBuf index 0 ;
    block = makeBoid();
    vertexBuffers[0]= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[0]); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block.vertices), gl.STATIC_DRAW); 
    normalBuffers[0] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[0]); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block.normals), gl.STATIC_DRAW); 
    triangleBuffers[0] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[0]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(block.triangles), gl.STATIC_DRAW);
    triSetSizes[0] = block.triSize;
}

function loadObstacle(){
    var block;
    //Load Type 1 block at vertBuf index 0 ;
    block = makeCube1();
    vertexBuffers[1]= gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers[1]); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block.vertices), gl.STATIC_DRAW); 
    normalBuffers[1] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[1]); 
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(block.normals), gl.STATIC_DRAW); 
    triangleBuffers[1] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffers[1]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(block.triangles), gl.STATIC_DRAW);
    triSetSizes[1] = block.triSize;
}

function makeBoidArr(){
    var curBoid;
    for(let i=0; i<numBoids; i++){
        boidArr[i] = new Boid();
        curBoid = boidArr[i];
        curBoid.addTranslate(i*1.1,0,0);
    }
}

function makeObstacleArr(){
    var curObs;
    for(let i=0; i<numObstacles; i++){
        obstacleArr[i] = new Obstacle();
        curObs = obstacleArr[i];
        curObs.translation = vec3.fromValues(Math.random()*worldFactor*0.75, Math.random()*worldFactor*0.75, Math.random()*worldFactor*0.75);
    }
}

function pushNewBoid(){
    let boid = new Boid();
    boid.addTranslate(Math.random()*worldFactor, Math.random()*worldFactor, Math.random()*worldFactor);
    boidArr.push(boid);
}

function pushNewObstacle(){
    let obstacle = new Obstacle();
    obstacle.translation = vec3.fromValues(Math.random()*worldFactor, Math.random()*worldFactor, Math.random()*worldFactor);
    obstacleArr.push(obstacle);
}

function giveMotion(){
    for(let i=0; i<boidArr.length; i++){
        var add = vec3.fromValues(0,0,0);
        boidArr[i].incrementCounter();
        boidArr[i].findFriends();
        boidArr[i].findFoes();
        var velReq = vec3.fromValues(0,0,0); 
        //velReqs
        var bAvoidVelReq = vec3.fromValues(0,0,0);
        var bAvoidMag = 0;
        var oAvoidVelReq = vec3.fromValues(0,0,0);
        var oAvoidMag = 0;
        var vMatchVelReq = vec3.fromValues(0,0,0);
        var vMatchMag = 0;
        var coheseVelReq = vec3.fromValues(0,0,0);
        var coheseMag = 0;
        var randVelReq = vec3.fromValues(0,0,0);
        var randMag = 0;
        var inertiaVelReq = vec3.fromValues(0,0,0);
        var inertiaMag = 0;

        var velReqMag = 0;

        // Boolean to detect overflow over defined Cap
        var velReqOverflow = 0;

        //Add Boundary avoidance and generate acceleartion request//////////////////
        if(bAvoid){
            let wallDistX = distanceFromWall(boidArr[i].translation, 0, 1);
            let wallDistY = distanceFromWall(boidArr[i].translation, 1, 1);
            let wallDistZ = distanceFromWall(boidArr[i].translation, 2, 1);
            let wallDistX1 = distanceFromWall(boidArr[i].translation, 0, -1);
            let wallDistY1 = distanceFromWall(boidArr[i].translation, 1, -1);
            let wallDistZ1 = distanceFromWall(boidArr[i].translation, 2, -1);

            if(wallDistX.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistX.dir, wallDistX.dir, obstAccFactor/wallDistX.magnitude ));} 
            if(wallDistY.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistY.dir, wallDistY.dir, obstAccFactor/wallDistY.magnitude ));} 
            if(wallDistZ.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistZ.dir, wallDistZ.dir, obstAccFactor/wallDistZ.magnitude ));} 
            if(wallDistX1.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistX1.dir, wallDistX1.dir, obstAccFactor/wallDistX1.magnitude ));} 
            if(wallDistY1.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistY1.dir, wallDistY1.dir, obstAccFactor/wallDistY1.magnitude ));} 
            if(wallDistZ1.magnitude < obstacleDistance) { vec3.add(bAvoidVelReq, bAvoidVelReq, vec3.scale(wallDistZ1.dir, wallDistZ1.dir, obstAccFactor/wallDistZ1.magnitude ));} 
        }
        bAvoidMag = vec3.distance(bAvoidVelReq, vec3.fromValues(0,0,0));
        ////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, bAvoidVelReq);
            velReqMag += bAvoidMag;
        }
        //Add Obstacle Avoidance //////////////////////////////////////////////////////
        if(oAvoid){
            //calculate the velocity request associated with avoiding obstacles
            for(let k=0; k<boidArr[i].obstaclesIndex.length; k++){
                var foe = obstacleArr[boidArr[i].obstaclesIndex[k]];
                var dist = vec3.distance(boidArr[i].translation, foe.translation);
                var velVec = vec3.fromValues(0,0,0); vec3.sub(velVec, boidArr[i].translation, foe.translation);
                vec3.add(oAvoidVelReq, oAvoidVelReq, vec3.scale(velVec, velVec, oAvoidFactor/(dist*boidArr[i].obstaclesIndex.length)));
            }
        }
        oAvoidMag = vec3.distance(oAvoidVelReq, vec3.fromValues(0,0,0));
        ////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, oAvoidVelReq);
            velReqMag += oAvoidMag;
        }
        // Add Velocity Matching////////////////////////////////////////////////////////
        var tempScale = vec3.fromValues(0,0,0);
        if(velocityMatch){
           for(let f=0; f<boidArr[i].friendsIndex.length; f++){
               let index = boidArr[i].friendsIndex[f];
               let friend = boidArr[index];
               //console.log(friend.velocity);
               vec3.add(vMatchVelReq, vMatchVelReq, vec3.scale(tempScale, friend.velocity, 1/boidArr[i].friendsIndex.length));
           } 
        }
        vec3.normalize(vMatchVelReq, vMatchVelReq);
        vec3.scale(vMatchVelReq,vMatchVelReq, velMatchFactor);
        vMatchMag = vec3.distance(vMatchVelReq, vec3.fromValues(0,0,0));
        ////////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, vMatchVelReq);
            velReqMag += vMatchMag;
        }
        // Add cohesion- Centering and Non-Crowding/////////////////////////////////////////
        var tempScale2 = vec3.fromValues(0,0,0); 
        if(cohese){
            var tempAvgPos = vec3.fromValues(0,0,0);
            //find Average translation of all friends.
            for(let f=0; f<boidArr[i].friendsIndex.length; f++){
                var friendForPos = boidArr[boidArr[i].friendsIndex[f]];
                vec3.add(tempAvgPos, tempAvgPos, vec3.scale(tempScale2, friendForPos.translation, 1/boidArr[i].friendsIndex.length));
            }
            //Subract from current boids' translation.
            var sub = vec3.fromValues(0,0,0); vec3.sub(sub, boidArr[i].translation, tempAvgPos);
            var distanceFromAvg = vec3.distance(sub, vec3.fromValues(0,0,0));
            //Give a velReq based on proximity to the average center. 
            if(distanceFromAvg>coheseDistance && distanceFromAvg<friendDistance){
                //Move Closer
                vec3.add(coheseVelReq, coheseVelReq, vec3.negate(sub, sub));
            } else {
                //Move away
                vec3.add(coheseVelReq, coheseVelReq, sub);
            }
        }
        vec3.normalize(coheseVelReq, coheseVelReq);
        vec3.scale(coheseVelReq, coheseVelReq, coheseFactor);
        coheseMag = vec3.distance(coheseVelReq, vec3.fromValues(0,0,0));
        ///////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, coheseVelReq);
        }
        //Add random velocity///////////////////////////////////////////////////////////////
        if(randMove){
            if(boidArr[i].counter%5 == 0){
                vec3.add(randVelReq, randVelReq, vec3.fromValues(Math.random(), Math.random(), Math.random())); 
                vec3.normalize(randVelReq,randVelReq);
                vec3.scale(randVelReq,randVelReq, randFactor);
            }
        }
        randMag = vec3.distance(randVelReq, vec3.fromValues(0,0,0));
        /////////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, randVelReq);
            velReqMag += randMag;
        }

        //Add inertia ///////////////////////////////////////////////////////////////////////
        if(inertia){
            vec3.add(inertiaVelReq, inertiaVelReq, boidArr[i].velocity);
            vec3.normalize(inertiaVelReq, inertiaVelReq);
            vec3.scale(inertiaVelReq, inertiaVelReq, inertiaCap);
        }
        inertiaMag = vec3.distance(inertiaVelReq, vec3.fromValues(0,0,0));
        /////////////////////////////////////////////////////////////////////////////////////
        if(velReqMag > velReqCap) velReqOverflow = 1;
        if(!velReqOverflow){
            vec3.add(velReq, velReq, inertiaVelReq);
            velReqMag += inertiaMag;
        }

        //Cap the acceleration
        //vec3.normalize(velReq,velReq);
        //vec3.scale(velReq,velReq,accReqCap);
        if(boidArr[i].counter % 500 == 0)
        {
            console.log("VelReq Values <Vector, Magnitude>: Boid"+i);
            console.log(bAvoidVelReq, bAvoidMag);
            console.log(oAvoidVelReq, oAvoidMag);
            console.log(vMatchVelReq, vMatchMag);
            ////console.log(coheseVelReq, coheseMag);
            console.log(randVelReq, randMag);
            console.log(inertiaVelReq, inertiaMag);
            console.log(velReq, velReqMag);
            console.log(boidArr[i].friendsIndex);
            console.log(boidArr[i].obstaclesIndex);
        }
        
        //Rotate Model Axes based on velocity Vector and adding that to transaltion
        boidArr[i].setVelocity(velReq[0],velReq[1], velReq[2]);
        boidArr[i].modifyXY();
        vec3.scale(add, boidArr[i].velocity, timeFactor);
        boidArr[i].addTranslate(add[0],add[1],add[2]);
    }
}

function motionLoop(){
}

function retTheta( v1, v2){
        var magV1 = Math.sqrt(Math.pow(v1[0],2)+ Math.pow(v1[1],2) + Math.pow(v1[2],2)); 
        var magV2 = Math.sqrt(Math.pow(v2[0],2)+ Math.pow(v2[1],2) + Math.pow(v2[2],2)); 
        if(magV1 != 0  && magV2!=0){
        magV1 = 1 / magV1;
        magV2 = 1 / magV2;
        }
        else{
            return 0;
        }
        var dot = vec3.dot( v1, v2);
        //console.log(v1, v2);
        //console.log(dot);
        //console.log(magV1, magV2);
        var cosTheta  = dot*(magV1*magV2);
        var theta = Math.acos(cosTheta);

        return theta;
}

function distanceFromWall(position, wallIndex, posneg){ // Wall index: 0-XWall 1-YWall 2-ZWall
    var dist = vec3.fromValues(0,0,0); 
    var temp = vec3.fromValues(position[0], position[1], position[2]); temp[wallIndex] = posneg *worldFactor;
    vec3.normalize(dist, vec3.sub(dist, position, temp));
    var mag = vec3.distance(position, temp);
    return { dir:dist, magnitude:mag};
}