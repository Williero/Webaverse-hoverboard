import * as THREE from 'three';
import metaversefile from 'metaversefile';
import { Vector3 } from 'three';

const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate, useScene} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();
const localVector4 = new THREE.Vector3();
const localVector5 = new THREE.Vector3();
const localQuaternion = new THREE.Quaternion();
const localQuaternion2 = new THREE.Quaternion();
const localQuaternion3 = new THREE.Quaternion();
const localEuler = new THREE.Euler();
const localMatrix = new THREE.Matrix4();
window.isDebug = false


export default () => {  

    const app = useApp();
    window.heli = app
    const physics = usePhysics();
    window.physics = physics;
    const scene = useScene();
    const physicsIds = [];
    const localPlayer = useLocalPlayer();

    let vehicleObj;

    let velocity = new THREE.Vector3();
    let angularVelocity = new THREE.Vector3();
    let vehicle = null;
    let yaw = 0;
    let roll = 0;
    let pitch = 0;
    let enginePower = 0;
    let powerFactor = 0.10;
    let damping =1;
    let rotor = null;
    let sitSpec = null;

    // Inputs
    let keyW = false;
    let keyA = false;
    let keyS = false;
    let keyD = false;
    let keyShift = false;
    let keyQ = false;
    let keyE = false;
    let keyC = false;

    let sitPos = null;

    let sitAnim = null;
    let rayArray = [];
    let wheelArray = [];
    let pointArray = [];
    let sceneWheels = [];
    let moveSpeed = 0;
    let newRot = 0;

    function onDocumentKeyDown(event) {
        var keyCode = event.which;
        if (keyCode == 87) { // W 
            keyW = true;
        }
        if (keyCode == 83) { // S 
            keyS = true;
        }
        if (keyCode == 65) { // A 
            keyA = true;
        }
        if (keyCode == 68) { // D 
            keyD = true;
        }
        if (keyCode == 69) { // E 
            keyE = true;
        }
        if (keyCode == 81) { // Q 
            keyQ = true;
        }
        if (keyCode == 16) { // L shift 
            keyShift = true;
        }
        if (keyCode == 67) { // C
            keyC = true;
        }
    };
    function onDocumentKeyUp(event) {
        var keyCode = event.which;
        if (keyCode == 87) { // W 
            keyW = false;
        }
        if (keyCode == 83) { // S 
            keyS = false;
        }
        if (keyCode == 65) { // A 
            keyA = false;
        }
        if (keyCode == 68) { // D 
            keyD = false;
        }
        if (keyCode == 69) { // E 
            keyE = false;
        }
        if (keyCode == 81) { // Q 
            keyQ = false;
        }
        if (keyCode == 16) { // L shift 
            keyShift = false;
        }
        if (keyCode == 67) { // C
            keyC = false;
        }
    };

    const _unwear = () => {
      if (sitSpec) {
        const sitAction = localPlayer.getAction('sit');
        if (sitAction) {
          localPlayer.removeAction('sit');
          // localPlayer.avatar.app.visible = true;
          // physics.setCharacterControllerPosition(localPlayer.characterController, app.position);
          sitSpec = null;
        }
      }
    };

    const loadModel = ( params ) => {

        return new Promise( ( resolve, reject ) => {
                
            const { gltfLoader } = useLoaders();
            gltfLoader.load( params.filePath + params.fileName, function( gltf ) {
                resolve( gltf.scene );     
            });
        })
    }

    const modelName = 'car/assets/car.glb';
    const modelName2 = 'heli/hoverboard_static.fbx';
    // const modelName = 'copter_var2_v2_vian.glb';
    // const modelName = 'copter_var3_v2_vian.glb';
    let p1 = loadModel( { filePath: baseUrl, fileName: modelName, pos: { x: 0, y: 0, z: 0 } } ).then( result => { vehicleObj = result } );
    let p2 = loadModel( { filePath: baseUrl, fileName: modelName2, pos: { x: 0, y: 0, z: 0 } } ).then( result => { vehicleObj = result } );

    let loadPromisesArr = [ p1 ];
    let loadPromisesArr2 = [ p2 ];

    Promise.all( loadPromisesArr ).then( models => {

        app.add( vehicleObj );

        const physicsId = physics.addBoxGeometry(
          new THREE.Vector3(0, 1.5, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(1, 0.1, 1.25), //0.5, 0.05, 1
          true
        );
        physicsIds.push(physicsId);
        
        vehicle = app.physicsObjects[0];
        window.vehicle = vehicle;
        vehicle.detached = true;

        vehicle.position.copy(app.position)
        physics.setTransform(vehicle);

        app.traverse(o => {
                  // Find propeller obj
                  
                  if(o.name === "sitPos") {
                    sitPos = o;
                    //console.log(o, "we have a sitPos");
                  }
                  if(o.name === "originFL") {
                    rayArray[0] = o;

                  }
                  if(o.name === "originFR") {
                    rayArray[1] = o;
                    
                  }
                  if(o.name === "originBL") {
                    rayArray[2] = o;
                    
                  }
                  if(o.name === "originBR") {
                    rayArray[3] = o;
                  }
                  if(o.name === "frontL") {
                    wheelArray[0] = o;

                  }
                  if(o.name === "frontR") {
                    wheelArray[1] = o;
                    
                  }
                  if(o.name === "backL") {
                    wheelArray[2] = o;
                    
                  }
                  if(o.name === "backR") {
                    wheelArray[3] = o;
                  }
                  //console.log(rayArray);
                  o.castShadow = true;
                });

                for (var i = 0; i < wheelArray.length; i++) {
                  let dum = new THREE.Object3D;
                  dum = wheelArray[i].clone();
                  scene.add(dum);
                  sceneWheels[i] = dum;
                  sceneWheels[i].updateMatrixWorld();
                  wheelArray[i].visible = false;
                }

    });

    Promise.all( loadPromisesArr2 ).then( models => {



        //app.add( vehicleObj );

        /*const physicsId = physics.addBoxGeometry(
          new THREE.Vector3(0, 0.5, 0),
          new THREE.Quaternion(),
          new THREE.Vector3(0.5, 0.05, 1),
          true
        );
        physicsIds.push(physicsId);
        
        vehicle = app.physicsObjects[0];
        window.vehicle = vehicle;
        vehicle.detached = true;

        vehicle.position.copy(app.position)
        physics.setTransform(vehicle);*/

        sitAnim = vehicleObj;

        console.log(vehicleObj);

    });

    useFrame(( { timeDiff } ) => {

      const _updateRide = () => {
        if (sitSpec && localPlayer.avatar && rayArray.length > 0) {
          const {instanceId} = app;

          if(sitSpec.mountType) {
            if(sitSpec.mountType === "flying") {
               localPlayer.avatar.app.visible = false;
              physics.enableGeometry(vehicle);
              let quat = new THREE.Quaternion(vehicle.quaternion.x, vehicle.quaternion.y, vehicle.quaternion.z, vehicle.quaternion.w);
              let right = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);
              let globalUp = new THREE.Vector3(0, 1, 0);
              let up = new THREE.Vector3(0, 1, 0).applyQuaternion(quat);
              let forward = new THREE.Vector3(0, 0, 1).applyQuaternion(quat);
              

              /*let propSpec = app.getComponent("propeller");
              if(propSpec) {

              }*/
              enginePower = 1;

              // IO
              if(keyW) {
                velocity.x += forward.x * powerFactor*2 * enginePower;
                velocity.y += forward.y * powerFactor*2* enginePower;
                velocity.z += forward.z * powerFactor*2 * enginePower;
                moveSpeed += powerFactor*2 * enginePower*50;
                //angularVelocity.x += right.x * powerFactor/2 * enginePower;
                //angularVelocity.y += right.y * powerFactor/2 * enginePower;
                //angularVelocity.z += right.z * powerFactor/2 * enginePower;
              }
              if (keyS) {
                velocity.x -= forward.x * powerFactor * enginePower;
                velocity.y -= forward.y * powerFactor * enginePower;
                velocity.z -= forward.z * powerFactor * enginePower;
                //angularVelocity.x -= right.x * powerFactor/2 * enginePower;
                //angularVelocity.y -= right.y * powerFactor/2 * enginePower;
                //angularVelocity.z -= right.z * powerFactor/2 * enginePower;
                moveSpeed -= powerFactor*2 * enginePower*50;
              }
              if(keyA) {
                //angularVelocity.x -= forward.x * powerFactor/2 * enginePower;
                //angularVelocity.y -= forward.y * powerFactor/2 * enginePower;
                //angularVelocity.z -= forward.z * powerFactor/2 * enginePower;
                //angularVelocity.x += up.x * powerFactor * velocity.length()/5;
                //angularVelocity.y += up.y * powerFactor * velocity.length()/5
                //angularVelocity.z += up.z * powerFactor * velocity.length()/5;
                newRot += powerFactor * enginePower*5;
              }
              if (keyD) {
                //angularVelocity.x += forward.x * powerFactor/2 * enginePower;
                //angularVelocity.y += forward.y * powerFactor/2 * enginePower;
                //angularVelocity.z += forward.z * powerFactor/2 * enginePower;
                //angularVelocity.x -= up.x * powerFactor * velocity.length()/5;
                //angularVelocity.y -= up.y * powerFactor * velocity.length()/5;
                //angularVelocity.z -= up.z * powerFactor * velocity.length()/5;
                newRot -= powerFactor * enginePower*5;
              }
              let gravity = new THREE.Vector3(0, -9.81, 0);
              let gravityCompensation = new THREE.Vector3(-gravity.x, -gravity.y, -gravity.z).length();
              gravityCompensation *= timeDiff/1000;
              gravityCompensation *= 0.95;
              let dot = globalUp.dot(up);
              gravityCompensation *= Math.sqrt(THREE.MathUtils.clamp(dot, 0, 1));

              let vertDamping = new THREE.Vector3(0, velocity.y, 0).multiplyScalar(-0.01);
              let vertStab = up.clone();
              vertStab.multiplyScalar(gravityCompensation);
              vertStab.add(vertDamping);
              vertStab.multiplyScalar(enginePower);

              // Fake gravity
              localVector.copy(new THREE.Vector3(0,-9.81, 0)).multiplyScalar(timeDiff/1000);
              velocity.add(localVector);

              velocity.add(vertStab);

              // Positional damping
              velocity.x *= 0.97;
              velocity.z *= 0.97;
              moveSpeed *= 0.97;
              newRot *= 0.97;

              //Stabilization
              let rotStabVelocity = new THREE.Quaternion().setFromUnitVectors(up, globalUp);
              rotStabVelocity.x *= 0.98;
              rotStabVelocity.y *= 0.98;
              rotStabVelocity.z *= 0.98;
              rotStabVelocity.w *= 0.98;
              let rotStabEuler = new THREE.Euler().setFromQuaternion(rotStabVelocity);
              
              //angularVelocity.x += rotStabEuler.x * enginePower /damping;
              //angularVelocity.y += rotStabEuler.y * enginePower/ damping;
              //angularVelocity.z += rotStabEuler.z * enginePower/ damping;

              //angularVelocity.x *= 0.95;
              //angularVelocity.y *= 0.95;
              //angularVelocity.z *= 0.95;

              const downQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI*0.5);
              let downRay = physics.raycast(vehicle.position, downQuat);
              let target = new THREE.Vector3();
              let target2 = new THREE.Vector3();
              let target3 = new THREE.Vector3();
              let target4 = new THREE.Vector3();
               rayArray[0].getWorldPosition( target );
               rayArray[1].getWorldPosition( target2 );
               rayArray[2].getWorldPosition( target3 );
               rayArray[3].getWorldPosition( target4 );
               pointArray[0] = physics.raycast(target, rayArray[0].quaternion);
               pointArray[1] = physics.raycast(target2, rayArray[1].quaternion);
               pointArray[2] = physics.raycast(target3, rayArray[2].quaternion);
               pointArray[3] = physics.raycast(target4, rayArray[3].quaternion);
/*
              if(downRay) {
                let force = 0;
                force = Math.abs(1 / (downRay.point[1] - vehicle.position.y))
                physics.addForce(vehicle, new THREE.Vector3(0, force, 0));
              }*/

              for (var i = 0; i < rayArray.length; i++) {
            
                  if(pointArray[i] && pointArray[i].distance <= 1.5) {

                    let localPos = new THREE.Vector3();
                    app.localToWorld(localPos);
                    localPos.y = pointArray[i].point[1] + 0.3;
                    app.worldToLocal(localPos);

                    
                    //wheelArray[i].position.y = 0;
                    if(pointArray[i].distance < 1) {
                      sceneWheels[i].position.setFromMatrixPosition( wheelArray[i].matrixWorld );
                      sceneWheels[i].position.y = pointArray[i].point[1] + 0.3;

                      let wheelRpm = Math.abs(velocity.length()) > 1 ? Math.abs(velocity.length()) / 100 : 0;
                      
                      //sceneWheels[i].rotateX(wheelRpm);
                      //sceneWheels[i].rotation.x += wheelRpm;
                      

                      //sceneWheels[i].rotation.y = vehicle.rotation.y;
                      
                      //sceneWheels[i].updateMatrixWorld();
                      sceneWheels[i].quaternion.copy(vehicle.quaternion);

                      if(sceneWheels[i] === sceneWheels[0]) {
                        var clampedRot = THREE.Math.clamp(newRot, -45, 45);
                        sceneWheels[i].rotation.y = THREE.Math.degToRad(clampedRot);
                      }

                      if(sceneWheels[i] === sceneWheels[1]) {
                        var clampedRot = THREE.Math.clamp(newRot, -45, 45);
                        sceneWheels[i].rotation.y = THREE.Math.degToRad(clampedRot);
                      }
                      
                      sceneWheels[i].updateMatrixWorld();
                      
                    }
                    else {
                      sceneWheels[i].position.setFromMatrixPosition( wheelArray[i].matrixWorld );
                      //sceneWheels[i].position.y = pointArray[i].point[1] + 0.3;
                      sceneWheels[i].quaternion.copy(vehicle.quaternion);
                      sceneWheels[i].updateMatrixWorld();
                    }

                    var dir = new THREE.Vector3(); // create once an reuse it
                    let v1 = rayArray[i].position.clone();
                    let targetss = new THREE.Vector3();
                    rayArray[i].getWorldPosition(targetss);
                    let targetss2 = new THREE.Vector3();
                    wheelArray[i].getWorldPosition(targetss2);
                    let v2 = new THREE.Vector3().fromArray(pointArray[i].point);
                    dir.subVectors(targetss, v2);
                    //velocity.add(dir);
                    let force = 0;
                    let yOffset = 0;
                    force = Math.abs(1 / ((pointArray[i].point[1] + 0.3) - targetss.y))
                    //force * (1/pointArray[i].distance + 3);
                    //console.log(force);
                    let newVec = new THREE.Vector3(0,force*2,0);

                    let tempLinear = new THREE.Vector3();
                    let tempAngular = new THREE.Vector3();
                    physics.getVelocity(vehicle, tempLinear);
                    physics.getAngularVelocity(vehicle, tempAngular);

                    let crossedVec = tempAngular.cross(new THREE.Vector3().fromArray(pointArray[i].point).sub(vehicle.position));

                    let pointVel = tempLinear.add(crossedVec);
                    //console.log(pointVel);

                    newRot = THREE.Math.clamp(newRot, -90, 90);
                    
                    newVec.applyQuaternion(vehicle.quaternion);
                    //vehicle.position.y + 1;
                    //physics.setTransform(vehicle);
                    //newVec.add(new THREE.Vector3(moveSpeed/10,0,0));
                    

                    

                    let fx = 0;
                    let fy = 0;

                    let newRotVec = new THREE.Vector3(0,0,0);
                    let newPointVec = new THREE.Vector3(0,0,0);
                    fx = newRot * 10;
                    fy = pointVel.x * 10;

                    newRotVec.x = fx * forward.x;
                    newRotVec.y = fx * forward.y;
                    newRotVec.z = fx * forward.z;

                    newPointVec.x = fy * -right.x;
                    newPointVec.y = fy * -right.y;
                    newPointVec.z = fy * -right.z;




                    //newVec.add(pointVel)
                    physics.addForceAtPos(vehicle, newVec.multiplyScalar(5.5), targetss);
                    //physics.addForceAtPos(vehicle, newRotVec, targetss);
                    physics.addForceAtPos(vehicle, newPointVec, targetss);
                  }
                }

              //Applying velocities
              let rasa = new THREE.Vector3();
              physics.getVelocity(vehicle, rasa);

              let gravv = new THREE.Vector3(rasa.x, -9.8, rasa.z).multiplyScalar(timeDiff/60);
              physics.setVelocity(vehicle, gravv, true);

              let wheelForward = new THREE.Vector3(0, 0, 1).applyQuaternion(sceneWheels[0].quaternion);
              physics.addForce(vehicle, forward.multiplyScalar(moveSpeed));

              physics.setAngularVelocity(vehicle, angularVelocity, true);

              if (rotor) { rotor.rotateZ(enginePower * 10); }

              /*if (sceneWheels[0]) { sceneWheels[0].rotateX(wheelRpm); }
              if (sceneWheels[1]) { sceneWheels[1].rotateX(wheelRpm); }
              if (sceneWheels[2]) { sceneWheels[2].rotateX(wheelRpm); }
              if (sceneWheels[3]) { sceneWheels[3].rotateX(wheelRpm); }*/
            }
          }
        }
        if(app && vehicle && sceneWheels.length >= 4) {
          //Applying physics transform to app
          app.position.copy(vehicle.position);
          app.quaternion.copy(vehicle.quaternion);
          app.updateMatrixWorld();

          for (var i = 0; i < sceneWheels.length; i++) {
            
          }
          // localPlayer.avatar.object.scene.children[0].children[0].quaternion.copy(vehicle.quaternion);
        }
      };
      _updateRide();

    });

    useActivate(() => {

      sitSpec = app.getComponent('sit');
      if (sitSpec) {
        let rideMesh = null;

        const {instanceId} = app;

        const rideBone = sitSpec.sitBone ? rideMesh.skeleton.bones.find(bone => bone.name === sitSpec.sitBone) : null;
        const sitAction = {
          type: 'sit',
          time: 0,
          animation: sitSpec.subtype,
          controllingId: instanceId,
          controllingBone: rideBone,
        };
        localPlayer.setControlAction(sitAction);
        app.wear(false);
      }
    
    });

    app.addEventListener('wearupdate', e => {
      if(e.wear) {
        document.addEventListener("keydown", onDocumentKeyDown, false);
        document.addEventListener('keyup', onDocumentKeyUp);
      } else {
        document.removeEventListener("keydown", onDocumentKeyDown, false);
        document.removeEventListener('keyup', onDocumentKeyUp);
        _unwear();
      }
    });

    useCleanup(() => {
      for (const physicsId of physicsIds) {
       physics.removeGeometry(physicsId);
      }
      _unwear();
    });

    return app;
}
