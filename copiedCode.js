//Solid CUbe
function makeCube1(){
    var vertexBuf = [];
    var triBuf = [];
    var normBuf = [];
    //var vertices = [[0,0,1],[1,0,1],[1,1,1],[0,1,1],[0,0,0],[1,0,0],[1,1,0],[0,1,0]];
    var vertices = [
                    [0,0,0],[0,0,1],[0,1,1],
                    [0,1,1],[0,1,0],[0,0,0],
                    [0,0,1],[1,0,1],[1,1,1],
                    [1,1,1],[0,1,1],[0,0,1],
                    [1,0,1],[1,0,0],[1,1,0],
                    [1,1,0],[1,1,1],[1,0,1],
                    [1,0,0],[0,0,0],[0,1,0],
                    [0,1,0],[1,1,0],[1,0,0],
                    [0,1,0],[0,1,1],[1,1,1],
                    [1,1,1],[1,1,0],[0,1,0],
                    [0,0,0],[1,0,0],[1,0,1],
                    [1,0,1],[0,0,1],[0,0,0]    
                    ];
    //var triangles = [[0,1,2],[2,3,0],[1,5,6],[6,2,1],[5,4,7],[7,6,5],[4,0,3],[3,7,4],[3,2,6],[6,7,3],[1,0,4],[4,5,1]];
    var triangles = [
                    [0,1,2],
                    [3,4,5],
                    [6,7,8],
                    [9,10,11],
                    [12,13,14],
                    [15,16,17],
                    [18,19,20],
                    [21,22,23],
                    [24,25,26],
                    [27,28,29],
                    [30,31,32],
                    [33,34,35]
                    ];
    //var normals =   [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1]];
    var normals = [
                    [-1,0,0],[-1,0,0],[-1,0,0],
                    [-1,0,0],[-1,0,0],[-1,0,0],
                    [0,0,1],[0,0,1],[0,0,1],
                    [0,0,1],[0,0,1],[0,0,1],
                    [1,0,0],[1,0,0],[1,0,0],
                    [1,0,0],[1,0,0],[1,0,0],
                    [0,0,-1],[0,0,-1],[0,0,-1],
                    [0,0,-1],[0,0,-1],[0,0,-1],
                    [0,1,0],[0,1,0],[0,1,0],
                    [0,1,0],[0,1,0],[0,1,0],
                    [0,-1,0],[0,-1,0],[0,-1,0],
                    [0,-1,0],[0,-1,0],[0,-1,0]
                  ];

    for(var i=0; i<vertices.length; i++)
    {
        vertexBuf.push(vertices[i][0],vertices[i][1],vertices[i][2]);
    }

    for(var i=0; i<triangles.length; i++)
    {
        triBuf.push(triangles[i][0],triangles[i][1],triangles[i][2]);
    }

    for(var i=0; i<normals.length; i++)
    {
        normBuf.push(normals[i][0],normals[i][1],normals[i][2]);
    }
    //triBufSize = triangles.length;
return({vertices:vertexBuf, normals:normBuf, triangles:triBuf, triSize:triangles.length});
}

// Cube with only top and bottom
function makeCube2(){
    var vertexBuf = [];
    var triBuf = [];
    var normBuf = [];
    var vertices = [[0,0,1],[1,0,1],[1,1,1],[0,1,1],[0,0,0],[1,0,0],[1,1,0],[0,1,0]];
    var triangles = [[6,2,3],[3,7,6],[4,0,1],[1,5,4]];
    var normals = [[0,1,0],[0,1,0],[0,-1,0],[0,-1,0],[0,1,0],[0,1,0],[0,-1,0],[0,-1,0]];

    for(var i=0; i<vertices.length; i++)
    {
        vertexBuf.push(vertices[i][0],vertices[i][1],vertices[i][2]);
    }

    for(var i=0; i<triangles.length; i++)
    {
        triBuf.push(triangles[i][0],triangles[i][1],triangles[i][2]);
    }

    for(var i=0; i<normals.length; i++)
    {
        normBuf.push(normals[i][0],normals[i][1],normals[i][2]);
    }
    //triBufSize = triangles.length;
return({vertices:vertexBuf, normals:normBuf, triangles:triBuf, triSize:triangles.length});
}

function makeBoid(){
    var vertexBuf = [];
    var triBuf = [];
    var normBuf = [];
    var vertices = [[0,0,0],[1,0,0],[1,1,0],
                    [1,1,0],[0,1,0], [0,0,0],
                    [0,0,0],[0.5,0.5,2],[0,1,0],
                    [0,1,0],[0.5,0.5,2],[1,1,0],
                    [1,1,0],[0.5,0.5,2],[1,0,0],
                    [1,0,0],[0.5,0.5,2],[0,0,0]];
    var triangles = [[2,1,0],[5,4,3],[6,7,8],[9,10,11],[12,13,14],[15,16,17]];
    var normals = [ [0,0,-1],[0,0,-1],[0,0,-1],
                    [0,0,-1],[0,0,-1],[0,0,-1],
                    [-1,0,1],[-1,0,1],[-1,0,1],
                    [0,1,1],[0,1,1],[0,1,1],
                    [1,0,1],[1,0,1],[1,0,1],
                    [0,-1,1],[0,-1,1],[0,-1,1]];

    for(var i=0; i<vertices.length; i++)
    {
        vertexBuf.push(vertices[i][0],vertices[i][1],vertices[i][2]);
    }

    for(var i=0; i<triangles.length; i++)
    {
        triBuf.push(triangles[i][0],triangles[i][1],triangles[i][2]);
    }

    for(var i=0; i<normals.length; i++)
    {
        normBuf.push(normals[i][0],normals[i][1],normals[i][2]);
    }
    //triBufSize = triangles.length;
return({vertices:vertexBuf, normals:normBuf, triangles:triBuf, triSize:triangles.length});
}


function random_m1to1(factor){
    return (Math.random()*2 -1)*factor;   
}

