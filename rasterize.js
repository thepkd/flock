///* GLOBAL CONSTANTS AND VARIABLES */
////import * as Stats from  'stats.js';
//
///* assignment specific globals */
const INPUT_URL = "https://ncsucg4games.github.io/prog2/"; // location of input files
const INPUT_TRIANGLES_URL = INPUT_URL + "triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = INPUT_URL + "spheres.json"; // spheres file loc
//const INPUT_ROOM_URL = INPUT_URL + "rooms.json"; // rooms file loc
const INPUT_ROOM_URL = "https://raw.githubusercontent.com/thepkd/scratchpad/master/rooms.json"; // rooms file loc
const LEGEND_URL = "https://raw.githubusercontent.com/thepkd/flock/master/newLegend.png";
//
//var defaultEye = vec3.fromValues(1,0.5,1); // default eye position in world space
//var defaultCenter = vec3.fromValues(1.5,0.5,1.5); // default view direction in world space
//var defaultUp = vec3.fromValues(0,1,0); // default view up vector
//var lightAmbient = vec3.fromValues(1,1,1); // default light ambient emission
//var lightDiffuse = vec3.fromValues(1,1,1); // default light diffuse emission
//var lightSpecular = vec3.fromValues(1,1,1); // default light specular emission
//var lightPosition = vec3.fromValues(6.5,0.5,2.5); // default light position
//var rotateTheta = Math.PI/50; // how much to rotate models by with each key press
//
/* input model data */
var gl = null; // the all powerful gl object. It's all here folks!
//var fps; // Update score with this element id.
//var stats;
var triCount = 0;
//var cullType = 1;
//var inputTriangles = []; // the triangle data as loaded from input files
//var numTriangleSets = 0; // how many triangle sets in input scene
var triSetSizes = []; // this contains the size of each triangle set
//var inputSpheres = []; // the sphere data as loaded from input files
//var numSpheres = 0; // how many spheres in the input scene
//var inputRooms = [];
//var roomArr= [];
//var furnitureArr = [];
var numBoids = 10;
var numObstacles = 10;
//
/* model data prepared for webgl */
var vertexBuffers = []; // vertex coordinate lists by set, in triples
var normalBuffers = []; // normal component lists by set, in triples
var uvBuffers = []; // uv coord lists by set, in duples
var triangleBuffers = []; // indices into vertexBuffers by set, in triples
var textures = []; // texture imagery by set
//
/* shader parameter locations */
var vPosAttribLoc; // where to put position for vertex shader
var vNormAttribLoc; // where to put normal for vertex shader
var vUVAttribLoc; // where to put UV for vertex shader
var mMatrixULoc; // where to put model matrix for vertex shader
var pvmMatrixULoc; // where to put project model view matrix for vertex shader
var ambientULoc; // where to put ambient reflecivity for fragment shader
var diffuseULoc; // where to put diffuse reflecivity for fragment shader
var specularULoc; // where to put specular reflecivity for fragment shader
var shininessULoc; // where to put specular exponent for fragment shader
var usingTextureULoc; // where to put using texture boolean for fragment shader
//var textureULoc; // where to put texture for fragment shader
//
///* interaction variables */
//var Eye = vec3.clone(defaultEye); // eye position in world space
//var Center = vec3.clone(defaultCenter); // view direction in world space
//var Up = vec3.clone(defaultUp); // view up vector in world space
//var viewDelta = 0.2; // how much to displace view with each key press
//
//// ASSIGNMENT HELPER FUNCTIONS
//
// get the JSON file from the passed URL
function getJSONFile(url,descr) {
    try {
        if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
            throw "getJSONFile: parameter not a string";
        else {
            var httpReq = new XMLHttpRequest(); // a new http request
            httpReq.open("GET",url,false); // init the request
            httpReq.send(null); // send the request
            var startTime = Date.now();
            while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                if ((Date.now()-startTime) > 3000)
                    break;
            } // until its loaded or we time out after three seconds
            if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                throw "Unable to open "+descr+" file!";
            else
                return JSON.parse(httpReq.response); 
        } // end if good params
    } // end try    
    
    catch(e) {
        console.log(e);
        return(String.null);
    }
} // end get input spheres
//
// does stuff when keys are pressed
function handleKeyDown(event) {
    
    const modelEnum = {TRIANGLES: "triangles", SPHERE: "sphere", OBSTACLE: "obstacle"}; // enumerated model type
    const dirEnum = {NEGATIVE: -1, POSITIVE: 1}; // enumerated rotation direction
    
    function highlightModel(modelType,whichModel) {
        if (handleKeyDown.modelOn != null)
            handleKeyDown.modelOn.on = false;
        handleKeyDown.whichOn = whichModel;
        if (modelType == modelEnum.OBSTACLE){
            handleKeyDown.modelOn = obstacleArr[whichModel]; 
        }
        handleKeyDown.modelOn.on = true; 
    } // end highlight model
    
    function translateModel(offset) {
        if (handleKeyDown.modelOn != null)
            vec3.add(handleKeyDown.modelOn.translation,handleKeyDown.modelOn.translation,offset);
    } // end translate model

    function rotateModel(axis,direction) {
        if (handleKeyDown.modelOn != null) {
            var newRotation = mat4.create();

            mat4.fromRotation(newRotation,direction*rotateTheta,axis); // get a rotation matrix around passed axis
            vec3.transformMat4(handleKeyDown.modelOn.xAxis,handleKeyDown.modelOn.xAxis,newRotation); // rotate model x axis tip
            vec3.transformMat4(handleKeyDown.modelOn.yAxis,handleKeyDown.modelOn.yAxis,newRotation); // rotate model y axis tip
        } // end if there is a highlighted model
    } // end rotate model
    
    // set up needed view params
    var lookAt = vec3.create(), viewRight = vec3.create(), temp = vec3.create(); // lookat, right & temp vectors
    lookAt = vec3.normalize(lookAt,vec3.subtract(temp,Center,Eye)); // get lookat vector
    viewRight = vec3.normalize(viewRight,vec3.cross(temp,lookAt,Up)); // get view right vector
    
    // highlight static variables
    handleKeyDown.whichOn = handleKeyDown.whichOn == undefined ? -1 : handleKeyDown.whichOn; // nothing selected initially
    handleKeyDown.modelOn = handleKeyDown.modelOn == undefined ? null : handleKeyDown.modelOn; // nothing selected initially

    switch (event.code) {
        case "Digit1":
            cullType = 1;
            break;
        case "Digit2":
            cullType = 2;
            break;
        case "Digit3":
            cullType = 3;
            break;
        // model selection
        case "Space": 
            if (handleKeyDown.modelOn != null)
                handleKeyDown.modelOn.on = false; // turn off highlighted model
            handleKeyDown.modelOn = null; // no highlighted model
            handleKeyDown.whichOn = -1; // nothing highlighted
            break;
        case "ArrowRight": // select next triangle set
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn+1) % numTriangleSets);
            break;
        case "ArrowLeft": // select previous triangle set
            highlightModel(modelEnum.TRIANGLES,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : numTriangleSets-1);
            break;
        case "ArrowUp": // select next sphere
            highlightModel(modelEnum.OBSTACLE,(handleKeyDown.whichOn+1) % obstacleArr.length);
            break;
        case "ArrowDown": // select previous sphere
            highlightModel(modelEnum.OBSTACLE,(handleKeyDown.whichOn > 0) ? handleKeyDown.whichOn-1 : obstacleArr.length-1);
            break;
            
        // view change
        case "KeyA": // translate view left, rotate left with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,viewDelta));
            break;
        case "KeyD": // translate view right, rotate right with shift
            Center = vec3.add(Center,Center,vec3.scale(temp,viewRight,-viewDelta));
            if (!event.getModifierState("Shift"))
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyS": // translate view backward, rotate up with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
                Up = vec.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,-viewDelta));
            } // end if shift not pressed
            break;
        case "KeyW": // translate view forward, rotate down with shift
            if (event.getModifierState("Shift")) {
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
                Up = vec.cross(Up,viewRight,vec3.subtract(lookAt,Center,Eye)); /* global side effect */
            } else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,lookAt,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,lookAt,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyQ": // translate view up, rotate counterclockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,-viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,viewDelta));
            } // end if shift not pressed
            break;
        case "KeyE": // translate view down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                Up = vec3.normalize(Up,vec3.add(Up,Up,vec3.scale(temp,viewRight,viewDelta)));
            else {
                Eye = vec3.add(Eye,Eye,vec3.scale(temp,Up,-viewDelta));
                Center = vec3.add(Center,Center,vec3.scale(temp,Up,-viewDelta));
            } // end if shift not pressed
            break;
        case "Escape": // reset view to default
            Eye = vec3.copy(Eye,defaultEye);
            Center = vec3.copy(Center,defaultCenter);
            Up = vec3.copy(Up,defaultUp);
            break;
            
        // model transformation
        case "KeyK": // translate left, rotate left with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,viewRight,viewDelta));
            break;
        case "Semicolon": // translate right, rotate right with shift
            if (event.getModifierState("Shift"))
                rotateModel(Up,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,viewRight,-viewDelta));
            break;
        case "KeyL": // translate backward, rotate up with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,lookAt,-viewDelta));
            break;
        case "KeyO": // translate forward, rotate down with shift
            if (event.getModifierState("Shift"))
                rotateModel(viewRight,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,lookAt,viewDelta));
            break;
        case "KeyI": // translate up, rotate counterclockwise with shift 
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.POSITIVE);
            else
                translateModel(vec3.scale(temp,Up,viewDelta));
            break;
        case "KeyP": // translate down, rotate clockwise with shift
            if (event.getModifierState("Shift"))
                rotateModel(lookAt,dirEnum.NEGATIVE);
            else
                translateModel(vec3.scale(temp,Up,-viewDelta));
            break;
        case "KeyV": // Toggle Velocity Match
            if(velocityMatch) velocityMatch = 0;
            else    velocityMatch =1;
            console.log("velocityMatch:" + velocityMatch);
            break;
        case "KeyB": // Toggle Obstacle Avoidance
            if(oAvoid) oAvoid = 0;
            else oAvoid = 1;
            console.log("oAvoid:" + oAvoid);
            break;
        case "KeyC": // Toggle Cohese
            if(cohese) cohese = 0;
            else cohese = 1;
            console.log("cohese:" + cohese);
            break;
        case "KeyN": // Push new boid
            pushNewBoid();
            break;
        case "KeyM": // Push new obstacle
            pushNewObstacle();
            break;
        case "Backspace": // reset model transforms to default
            for (var whichTriSet=0; whichTriSet<numTriangleSets; whichTriSet++) {
                vec3.set(inputTriangles[whichTriSet].translation,0,0,0);
                vec3.set(inputTriangles[whichTriSet].xAxis,1,0,0);
                vec3.set(inputTriangles[whichTriSet].yAxis,0,1,0);
            } // end for all triangle sets
            for (var whichSphere=0; whichSphere<numSpheres; whichSphere++) {
                vec3.set(inputSpheres[whichSphere].translation,0,0,0);
                vec3.set(inputSpheres[whichSphere].xAxis,1,0,0);
                vec3.set(inputSpheres[whichSphere].yAxis,0,1,0);
            } // end for all spheres
            break;
    } // end switch
} // end handleKeyDown

//// set up the webGL environment
//function setupWebGL() {
//    
//    // Set up keys
//    document.onkeydown = handleKeyDown; // call this when key pressed
//
//    // create a webgl canvas and set it up
//    var webGLCanvas = document.getElementById("myWebGLCanvas"); // create a webgl canvas
//    gl = webGLCanvas.getContext("webgl"); // get a webgl object from it
//    try{ var fpsCanvas = document.getElementById("myScoreCanvas"); } catch(e){console.log(e);}
//    fps = fpsCanvas.getContext("2d");
//    fps.font="20px Arial";
//    fps.fillStyle='white';
//    fps.strokeStyle='white';
//    stats = new Stats();
//    stats.showPanel(0);
//    document.body.appendChild( stats.dom );
//
//    console.log(fps);
//    try {
//      if (gl == null) {
//        throw "unable to create gl context -- is your browser gl ready?";
//      } else {
//        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
//        gl.clearDepth(1.0); // use max when we clear the depth buffer
//        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
//      }
//    } // end try
//
//    
//    
//    catch(e) {
//      console.log(e);
//    } // end catch
// 
//} // end setupWebGL
//
//// read models in, load them into webgl buffers
function loadModels() {
    
    // load a texture for the current set or sphere
    function loadTexture(whichModel,currModel,textureFile) {
        
        // load a 1x1 gray image into texture for use when no texture, and until texture loads
        textures[whichModel] = gl.createTexture(); // new texture struct for model
        var currTexture = textures[whichModel]; // shorthand
        gl.bindTexture(gl.TEXTURE_2D, currTexture); // activate model's texture
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // invert vertical texcoord v, load gray 1x1
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,new Uint8Array([64, 64, 64, 255]));        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // invert vertical texcoord v
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); // use linear filter for magnification
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // use mipmap for minification
        gl.generateMipmap(gl.TEXTURE_2D); // construct mipmap pyramid
        gl.bindTexture(gl.TEXTURE_2D, null); // deactivate model's texture
        
        // if there is a texture to load, asynchronously load it
        if (textureFile != false) {
            currTexture.image = new Image(); // new image struct for texture
            currTexture.image.onload = function () { // when texture image loaded...
                gl.bindTexture(gl.TEXTURE_2D, currTexture); // activate model's new texture
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, currTexture.image); // norm 2D texture
                gl.generateMipmap(gl.TEXTURE_2D); // rebuild mipmap pyramid
                gl.bindTexture(gl.TEXTURE_2D, null); // deactivate model's new texture
            } // end when texture image loaded
            currTexture.image.onerror = function () { // when texture image load fails...
                console.log("Unable to load texture " + textureFile); 
            } // end when texture image load fails
            currTexture.image.crossOrigin = "Anonymous"; // allow cross origin load, please
            currTexture.image.src = INPUT_URL + textureFile; // set image location
        } // end if material has a texture
    } // end load texture
    
    // make a sphere with radius 1 at the origin, with numLongSteps longitudes. 
    // Returns verts, tris and normals.
    function makeSphere(numLongSteps) {
        
        try {
            if (numLongSteps % 2 != 0)
                throw "in makeSphere: uneven number of longitude steps!";
            else if (numLongSteps < 4)
                throw "in makeSphere: number of longitude steps too small!";
            else { // good number longitude steps
            
                // make vertices, normals and uvs -- repeat longitude seam
                const INVPI = 1/Math.PI, TWOPI = Math.PI+Math.PI, INV2PI = 1/TWOPI, epsilon=0.001*Math.PI;
                var sphereVertices = [0,-1,0]; // vertices to return, init to south pole
                var sphereUvs = [0.5,0]; // uvs to return, bottom texture row collapsed to one texel
                var angleIncr = TWOPI / numLongSteps; // angular increment 
                var latLimitAngle = angleIncr * (Math.floor(numLongSteps*0.25)-1); // start/end lat angle
                var latRadius, latY, latV; // radius, Y and texture V at current latitude
                for (var latAngle=-latLimitAngle; latAngle<=latLimitAngle+epsilon; latAngle+=angleIncr) {
                    latRadius = Math.cos(latAngle); // radius of current latitude
                    latY = Math.sin(latAngle); // height at current latitude
                    latV = latAngle*INVPI + 0.5; // texture v = (latAngle + 0.5*PI) / PI
                    for (var longAngle=0; longAngle<=TWOPI+epsilon; longAngle+=angleIncr) { // for each long
                        sphereVertices.push(-latRadius*Math.sin(longAngle),latY,latRadius*Math.cos(longAngle));
                        sphereUvs.push(longAngle*INV2PI,latV); // texture u = (longAngle/2PI)
                    } // end for each longitude
                } // end for each latitude
                sphereVertices.push(0,1,0); // add north pole
                sphereUvs.push(0.5,1); // top texture row collapsed to one texel
                var sphereNormals = sphereVertices.slice(); // for this sphere, vertices = normals; return these

                // make triangles, first poles then middle latitudes
                var sphereTriangles = []; // triangles to return
                var numVertices = Math.floor(sphereVertices.length/3); // number of vertices in sphere
                for (var whichLong=1; whichLong<=numLongSteps; whichLong++) { // poles
                    sphereTriangles.push(0,whichLong,whichLong+1);
                    sphereTriangles.push(numVertices-1,numVertices-whichLong-1,numVertices-whichLong-2);
                } // end for each long
                var llVertex; // lower left vertex in the current quad
                for (var whichLat=0; whichLat<(numLongSteps/2 - 2); whichLat++) { // middle lats
                    for (var whichLong=0; whichLong<numLongSteps; whichLong++) {
                        llVertex = whichLat*(numLongSteps+1) + whichLong + 1;
                        sphereTriangles.push(llVertex,llVertex+numLongSteps+1,llVertex+numLongSteps+2);
                        sphereTriangles.push(llVertex,llVertex+numLongSteps+2,llVertex+1);
                    } // end for each longitude
                } // end for each latitude
            } // end if good number longitude steps
            return({vertices:sphereVertices, normals:sphereNormals, uvs:sphereUvs, triangles:sphereTriangles});
        } // end try
        
        catch(e) {
            console.log(e);
        } // end catch
    } // end make sphere

    
} // end load models
//
//// setup the webGL shaders
//function setupShaders() {
//    
//    // define vertex shader in essl using es6 template strings
//    var vShaderCode = `
//        attribute vec3 aVertexPosition; // vertex position
//        attribute vec3 aVertexNormal; // vertex normal
//        //attribute vec2 aVertexUV; // vertex texture uv
//        
//        uniform mat4 umMatrix; // the model matrix
//        uniform mat4 upvmMatrix; // the project view model matrix
//        
//        varying vec3 vWorldPos; // interpolated world position of vertex
//        varying vec3 vVertexNormal; // interpolated normal for frag shader
//        //varying vec2 vVertexUV; // interpolated uv for frag shader
//
//        void main(void) {
//            
//            // vertex position
//            vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
//            vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
//            gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);
//
//            // vertex normal (assume no non-uniform scale)
//            vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
//            vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z)); 
//            
//            // vertex uv
//            //vVertexUV = aVertexUV;
//        }
//    `;
//    
//    // define fragment shader in essl using es6 template strings
//    var fShaderCode = `
//        precision mediump float; // set float to medium precision
//
//        // eye location
//        uniform vec3 uEyePosition; // the eye's position in world
//        
//        // light properties
//        uniform vec3 uLightAmbient; // the light's ambient color
//        uniform vec3 uLightDiffuse; // the light's diffuse color
//        uniform vec3 uLightSpecular; // the light's specular color
//        uniform vec3 uLightPosition; // the light's position
//        
//        // material properties
//        uniform vec3 uAmbient; // the ambient reflectivity
//        uniform vec3 uDiffuse; // the diffuse reflectivity
//        //uniform vec3 uSpecular; // the specular reflectivity
//        //uniform float uShininess; // the specular exponent
//        
//        // texture properties
//        uniform bool uUsingTexture; // if we are using a texture
//        //uniform sampler2D uTexture; // the texture for the fragment
//        //varying vec2 vVertexUV; // texture uv of fragment
//            
//        // geometry properties
//        varying vec3 vWorldPos; // world xyz of fragment
//        varying vec3 vVertexNormal; // normal of fragment
//        
//        void main(void) {
//        
//            // ambient term
//            vec3 ambient = uAmbient*uLightAmbient; 
//            
//            // diffuse term
//            vec3 normal = normalize(vVertexNormal); 
//            vec3 light = normalize(uLightPosition - vWorldPos);
//            float lambert = max(0.0,dot(normal,light));
//            vec3 diffuse = uDiffuse*uLightDiffuse*lambert; // diffuse term
//            
//            // specular term
//            //vec3 eye = normalize(uEyePosition - vWorldPos);
//            //vec3 halfVec = normalize(light+eye);
//            //float highlight = pow(max(0.0,dot(normal,halfVec)),uShininess);
//            //vec3 specular = uSpecular*uLightSpecular*highlight; // specular term
//            
//            // combine to find lit color
//            //vec3 litColor = ambient + diffuse + specular; 
//            vec3 litColor = ambient + diffuse; 
//            
//            if (!uUsingTexture) {
//                gl_FragColor = vec4(litColor, 1.0);
//            } else {
//            //    vec4 texColor = texture2D(uTexture, vec2(vVertexUV.s, vVertexUV.t));
//            
//                // gl_FragColor = vec4(texColor.rgb * litColor, texColor.a);
//            //    gl_FragColor = vec4(texColor.rgb * litColor, 1.0);
//            } // end if using texture
//        } // end main
//    `;
//    
//    try {
//        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
//        gl.shaderSource(fShader,fShaderCode); // attach code to shader
//        gl.compileShader(fShader); // compile the code for gpu execution
//
//        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
//        gl.shaderSource(vShader,vShaderCode); // attach code to shader
//        gl.compileShader(vShader); // compile the code for gpu execution
//            
//        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
//            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
//            gl.deleteShader(fShader);
//        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
//            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
//            gl.deleteShader(vShader);
//        } else { // no compile errors
//            var shaderProgram = gl.createProgram(); // create the single shader program
//            gl.attachShader(shaderProgram, fShader); // put frag shader in program
//            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
//            gl.linkProgram(shaderProgram); // link program into gl context
//
//            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
//                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
//            } else { // no shader program link errors
//                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
//                
//                // locate and enable vertex attributes
//                vPosAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexPosition"); // ptr to vertex pos attrib
//                gl.enableVertexAttribArray(vPosAttribLoc); // connect attrib to array
//                vNormAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexNormal"); // ptr to vertex normal attrib
//                gl.enableVertexAttribArray(vNormAttribLoc); // connect attrib to array
//                //vUVAttribLoc = gl.getAttribLocation(shaderProgram, "aVertexUV"); // ptr to vertex UV attrib
//                //gl.enableVertexAttribArray(vUVAttribLoc); // connect attrib to array
//                
//                // locate vertex uniforms
//                mMatrixULoc = gl.getUniformLocation(shaderProgram, "umMatrix"); // ptr to mmat
//                pvmMatrixULoc = gl.getUniformLocation(shaderProgram, "upvmMatrix"); // ptr to pvmmat
//                
//                // locate fragment uniforms
//                var eyePositionULoc = gl.getUniformLocation(shaderProgram, "uEyePosition"); // ptr to eye position
//                var lightAmbientULoc = gl.getUniformLocation(shaderProgram, "uLightAmbient"); // ptr to light ambient
//                var lightDiffuseULoc = gl.getUniformLocation(shaderProgram, "uLightDiffuse"); // ptr to light diffuse
//                var lightSpecularULoc = gl.getUniformLocation(shaderProgram, "uLightSpecular"); // ptr to light specular
//                var lightPositionULoc = gl.getUniformLocation(shaderProgram, "uLightPosition"); // ptr to light position
//                ambientULoc = gl.getUniformLocation(shaderProgram, "uAmbient"); // ptr to ambient
//                diffuseULoc = gl.getUniformLocation(shaderProgram, "uDiffuse"); // ptr to diffuse
//                //specularULoc = gl.getUniformLocation(shaderProgram, "uSpecular"); // ptr to specular
//                //shininessULoc = gl.getUniformLocation(shaderProgram, "uShininess"); // ptr to shininess
//                usingTextureULoc = gl.getUniformLocation(shaderProgram, "uUsingTexture"); // ptr to using texture
//                //textureULoc = gl.getUniformLocation(shaderProgram, "uTexture"); // ptr to texture
//                
//                // pass global (not per model) constants into fragment uniforms
//                gl.uniform3fv(eyePositionULoc,Eye); // pass in the eye's position
//                gl.uniform3fv(lightAmbientULoc,lightAmbient); // pass in the light's ambient emission
//                gl.uniform3fv(lightDiffuseULoc,lightDiffuse); // pass in the light's diffuse emission
//                gl.uniform3fv(lightSpecularULoc,lightSpecular); // pass in the light's specular emission
//                gl.uniform3fv(lightPositionULoc,lightPosition); // pass in the light's position
//            } // end if no shader program link errors
//        } // end if no compile errors
//    } // end try 
//    
//    catch(e) {
//        console.log(e);
//    } // end catch
//} // end setup shaders

//// render the loaded model
function renderModels() {
    
    // construct the model transform matrix, based on model state
    function makeModelTransform(currModel) {
        var zAxis = vec3.create(), sumRotation = mat4.create(), temp = mat4.create(), negCenter = vec3.create();

        vec3.normalize(zAxis,vec3.cross(zAxis,currModel.xAxis,currModel.yAxis)); // get the new model z axis
        mat4.set(sumRotation, // get the composite rotation
            currModel.xAxis[0], currModel.xAxis[1], currModel.xAxis[2], 0,
            currModel.yAxis[0], currModel.yAxis[1], currModel.yAxis[2], 0,
            zAxis[0], zAxis[1], zAxis[2], 0,
            0, 0, 0, 1);
        vec3.negate(negCenter,currModel.center);
        mat4.multiply(sumRotation,sumRotation,mat4.fromTranslation(temp,negCenter)); // rotate * -translate
        mat4.multiply(sumRotation,mat4.fromTranslation(temp,currModel.center),sumRotation); // translate * rotate * -translate
        mat4.fromTranslation(mMatrix,currModel.translation); // translate in model matrix
        mat4.multiply(mMatrix,mMatrix,sumRotation); // rotate in model matrix
    } // end make model transform
    
    var hMatrix = mat4.create(); // handedness matrix
    var pMatrix = mat4.create(); // projection matrix
    var vMatrix = mat4.create(); // view matrix
    var mMatrix = mat4.create(); // model matrix
    var hpvMatrix = mat4.create(); // hand * proj * view matrices
    var hpvmMatrix = mat4.create(); // hand * proj * view * model matrices
    const HIGHLIGHTMATERIALBOID = 
        {ambient:[0.2,0.2,0.2], diffuse:[0,0.5,0.5], specular:[0.2,0.2,0.2], n:5, alpha:1, texture:false}; // hlht mat
    
    window.requestAnimationFrame(renderModels); // set up frame render callback
    
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers
    
    // set up handedness, projection and view
    mat4.fromScaling(hMatrix,vec3.fromValues(1,1,1)); // create handedness matrix
    mat4.perspective(pMatrix,0.5*Math.PI,1,0.1,100); // create projection matrix
    //mat4.ortho(pMatrix, -10, 10, -10, 10, 0.1, 100);
    mat4.lookAt(vMatrix,Eye,Center,Up); // create view matrix
    mat4.multiply(hpvMatrix,hMatrix,pMatrix); // handedness * projection
    mat4.multiply(hpvMatrix,hpvMatrix,vMatrix); // handedness * projection * view

    // render each boid
    var boid, currMaterial; // the current sphere and material
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[0]); // activate vertex buffer
    gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed vertex buffer to shader
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[0]); // activate normal buffer
    gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed normal buffer to shader
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[0]); // activate tri buffer
    
    for (var whichBoid=0; whichBoid<boidArr.length; whichBoid++) {
        boid = boidArr[whichBoid];
        
        // define model transform, premult with pvmMatrix, feed to shader
        makeModelTransform(boid);
        mat4.multiply(hpvmMatrix,hpvMatrix,mMatrix); // handedness * project * view * model
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, hpvmMatrix); // pass in the hpvm matrix
        
        currMaterial = HIGHLIGHTMATERIALBOID;
        
        gl.uniform3fv(ambientULoc,currMaterial.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,currMaterial.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,currMaterial.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,currMaterial.n); // pass in the specular exponent
        gl.uniform1i(usingTextureULoc,(currMaterial.texture != false)); // whether the set uses texture
        //gl.activeTexture(gl.TEXTURE0); // bind to active texture 0 (the first)
        //gl.bindTexture(gl.TEXTURE_2D, textures[whichTriSet]); // bind the set's texture
        //gl.uniform1i(textureULoc, 0); // pass in the texture and active texture 0
        
        gl.drawElements(gl.TRIANGLES,3*triSetSizes[0],gl.UNSIGNED_SHORT,0); // render

        
    } // end for each sphere

    // render each boid
    var obstacle, currMaterial; // the current sphere and material
    gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffers[1]); // activate vertex buffer
    gl.vertexAttribPointer(vPosAttribLoc,3,gl.FLOAT,false,0,0); // feed vertex buffer to shader
    gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffers[1]); // activate normal buffer
    gl.vertexAttribPointer(vNormAttribLoc,3,gl.FLOAT,false,0,0); // feed normal buffer to shader
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffers[1]); // activate tri buffer

    const HIGHLIGHTMATERIALOBSTACLE = 
        {ambient:[0.2,0.2,0.2], diffuse:[1,1,0], specular:[0.2,0.2,0.2], n:5, alpha:1, texture:false}; // hlht mat
    const NORMALOBSTACLE = 
        {ambient:[0.2,0.2,0.2], diffuse:[0.5,0,0], specular:[0.2,0.2,0.2], n:5, alpha:1, texture:false}; // hlht mat
    

    for(var whichObstacle=0; whichObstacle<obstacleArr.length; whichObstacle++){
        obstacle = obstacleArr[whichObstacle];
        makeModelTransform(obstacle);
        mat4.multiply(hpvmMatrix,hpvMatrix,mMatrix); // handedness * project * view * model
        gl.uniformMatrix4fv(mMatrixULoc, false, mMatrix); // pass in the m matrix
        gl.uniformMatrix4fv(pvmMatrixULoc, false, hpvmMatrix); // pass in the hpvm matrix
        
        if(obstacle.on)
            currMaterial = HIGHLIGHTMATERIALOBSTACLE;
        else    
            currMaterial = NORMALOBSTACLE;
        
        gl.uniform3fv(ambientULoc,currMaterial.ambient); // pass in the ambient reflectivity
        gl.uniform3fv(diffuseULoc,currMaterial.diffuse); // pass in the diffuse reflectivity
        gl.uniform3fv(specularULoc,currMaterial.specular); // pass in the specular reflectivity
        gl.uniform1f(shininessULoc,currMaterial.n); // pass in the specular exponent
        gl.uniform1i(usingTextureULoc,(currMaterial.texture != false)); // whether the set uses texture
        //gl.activeTexture(gl.TEXTURE0); // bind to active texture 0 (the first)
        //gl.bindTexture(gl.TEXTURE_2D, textures[whichTriSet]); // bind the set's texture
        //gl.uniform1i(textureULoc, 0); // pass in the texture and active texture 0
        
        gl.drawElements(gl.TRIANGLES,3*triSetSizes[1],gl.UNSIGNED_SHORT,0); // render
    }

    giveMotion();

} // end render model

function boidTr(){
    boidArr[1].findFriends();
    console.log(boidArr[1].friendsIndex);
}
/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  setupShaders(); // setup the webGL shaders
  loadBoid();
  loadObstacle();
  makeBoidArr();
  makeObstacleArr();

  //pushNewBoid();
  renderModels();
  boidTr();
  //giveMotion();
  //console.log(boidArr);
  //console.log(boidArr[0]);
  
} // end main
