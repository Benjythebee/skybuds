import * as THREE from "three"

import CameraFrameManager from "./cameraFrameManager";
import { Walker } from "./Walker";

const screenshotSize = 4096;

export type Shots = 'fullshot'|'cowboyshot'|'closeup'|'mediumcloseup'|'mediumshot'|'mediumcloseupshot'|'closeupshot';


export class ScreenshotManager {

  renderer:THREE.WebGLRenderer;

  textureLoader:THREE.TextureLoader;
  sceneBackground:THREE.Color | THREE.Texture;
  sceneBackgroundAlpha:number;
  frameOffset:{min:number,max:number};
  usesBackgroundImage:boolean;
  backgroundMaterial:THREE.MeshBasicMaterial;
  backgroundPlane:THREE.Mesh;

  cameraFrameManager: CameraFrameManager;

  directionalLight:THREE.DirectionalLight | null = null;
  constructor(public scene:THREE.Scene) {
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      antialias: true,
      alpha:true
    });
    this.renderer.setClearAlpha(0);
    (this.renderer as any).premultipliedAlpha = false;

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer.setSize(screenshotSize, screenshotSize);

    const camera = new THREE.PerspectiveCamera( 30, 1, 0.1, 500 );
    camera.frustumCulled = false;
    this.textureLoader = new THREE.TextureLoader();
    this.sceneBackground = new THREE.Color(0.1,0.1,0.1);
    this.sceneBackgroundAlpha = 1;
    this.frameOffset = {
      min:0.2,
      max:0.2,
    }
    this.usesBackgroundImage = false;

    this.backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const geometry = new THREE.PlaneGeometry(100, 100); // Adjust size as needed
    const plane = new THREE.Mesh(geometry, this.backgroundMaterial);
    plane.renderOrder = -1
    this.backgroundPlane = plane;
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    this.directionalLight.visible = false;
    this.scene.add(this.directionalLight);
    this.cameraFrameManager = new CameraFrameManager(camera);
  }

  get camera(){
    return this.cameraFrameManager.camera
  }

  setScene(scene:THREE.Scene){
    this.scene = scene;
  }

  async takeScreenshotOfCharacter(walker:Walker, width:number, height:number, trimmed = false){
    this.cameraFrameManager.setFrameTarget(walker.object);
    await this.cameraFrameManager.calculateBoneOffsets(walker.object,0.05)
    this.cameraFrameManager.frameCloseupShot()

    // Face the camera
    const direction = new THREE.Vector3()
    const camera = this.cameraFrameManager.camera
    const prevRotation = walker.object.rotation.clone()
    direction.subVectors(camera.position, walker.object.position).normalize()
    const target = new THREE.Vector3().addVectors(walker.object.position, direction)
    target.y = walker.object.position.y
    walker.object.lookAt(target)

    walker.forceUpdateWearables()

    if(this.directionalLight){
      this.directionalLight.position.copy(camera.position);
      this.directionalLight.target = walker.object;
      this.directionalLight.visible = true;
    }

    // Set blue background
    // this.setBackground([0.1, 0.1, 0.9]);
    const imgData = this.getImageData(width, height, trimmed,'jpeg');
    if(this.directionalLight){
      this.directionalLight.visible = false;
    }

    walker.object.rotation.copy(prevRotation);

    return imgData;
  }

  setupCamera(cameraPosition:THREE.Vector3, lookAtPosition:THREE.Vector3, fieldOfView = 30){
    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(lookAtPosition)
    this.camera.fov = fieldOfView;
  }

  /**
   * Sets the background using either color or image.
   * 
   * @param {Array|string} background - If an array, assumed to be RGB values [r, g, b].
   *                                    If a string, assumed to be a URL for the background image.
   */
  setBackground(background:string|number[]){
    if (Array.isArray(background)){
      const alpha = background[3] ?? 1

      this.setBackgroundColor(background[0],background[1],background[2],alpha)
    }
    else{
      this.setBackgroundImage(background);
    }
  }

  setBackgroundColor(r:number,g:number,b:number,a:number){
    //@ts-ignore FIX THIS
    const color = new THREE.Color(r,g,b,a);
    this.sceneBackground = color
    a = a ?? 1;
    if (a > 1) a = 1;
    if (a < 0) a = 0;
    this.sceneBackgroundAlpha = a;
    this.backgroundMaterial.color = color;
    this.usesBackgroundImage = false;
  }

  texureLoader:THREE.TextureLoader = new THREE.TextureLoader();
  setBackgroundImage(url:string){
    return new Promise(async (resolve, reject) => {
      try{
        const backgroundTexture = await this.texureLoader.load(url);
        if (backgroundTexture){
          backgroundTexture.wrapS = backgroundTexture.wrapT = THREE.RepeatWrapping;
          this.sceneBackground = backgroundTexture;
          this.usesBackgroundImage = true;
          this.sceneBackgroundAlpha = 1;
          resolve(true);
        }
      }
      catch(error){
        console.error("Error loading background image: ", error)
        reject(error)
      }
    });
  }

  _setBackground() {
    if (this.usesBackgroundImage == false && this.sceneBackgroundAlpha != 1){
      if (this.sceneBackgroundAlpha == 0){
        this.scene.background = null;
      }
      else{
        this.scene.background = null;
        this.scene.add(this.backgroundPlane);
        this.backgroundPlane.position.copy(this.camera.position);
        var direction = new THREE.Vector3(0, 0, -1);  // Adjust the direction if needed
        direction.applyQuaternion(this.camera.quaternion);
        var distance = 2;  // Adjust the distance as needed
        this.backgroundPlane.position.addScaledVector(direction, distance);
        this.backgroundPlane.lookAt(this.camera.position);
      }
    }
    else{
      this.scene.background = this.sceneBackground;
    }
  }
  _restoreBackground(){
    this.scene.background = null;
    if (this.usesBackgroundImage == false && this.sceneBackgroundAlpha != 1){
      this.scene.remove(this.backgroundPlane);
    }
  }
  getImageData(width: number, height: number, trimmed = false,extension = 'png') {
    return this._createImage(width, height, trimmed, extension)
  }


  _createImage(width:number, height:number, base64Trimmed = false, extension = 'png') {
    const aspectRatio = width / height;
    this.renderer.setSize(width, height);

    const strMime = `image/${extension}`;

    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
    const renderer = this.renderer;
    try {
      
      this._setBackground();
      renderer.render(this.scene, this.camera);
      let imgData = renderer.domElement.toDataURL(strMime,extension=='jpeg'?0.55:0.9);
      if(base64Trimmed){
        // trim the base64 part of the string
        imgData = imgData.replace(/^data:image\/\w+;base64,/, "")
      }
      this._restoreBackground();
      return  imgData
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  saveScreenshot(imageName:string,width:number, height:number){
    const imgData =  this._createImage(width, height)
    if(!imgData) throw new Error("saveScreenshot: Error creating image");
    const strDownloadMime = "image/octet-stream";
    const strMime = "image/png";
    this.saveFile(imgData.replace(strMime, strDownloadMime), imageName + ".png");
  }

  getScreenshotImage(width:number, height:number){
    const imgData = this._createImage(width, height);
    if(!imgData) throw new Error("getScreenshotImage: Error creating image");
    const img = new Image();
    img.src = imgData;
    return img;
  }
  getScreenshotTexture(width:number, height:number){
    const img = this.getScreenshotImage(width,height)
    const texture = new THREE.Texture(img);
    texture.needsUpdate = true;
    return texture;
  }
  getScreenshotBlob(width:number, height:number){
    const imgData = this._createImage(width, height)
    if(!imgData) throw new Error("getScreenshotBlob: Error creating image");
    const base64Data = Buffer.from(
      imgData.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const blob = new Blob([base64Data], { type: "image/jpeg" }); 
    return blob; 
  }
  saveFile (strData:string, filename:string) {
    const link = document.createElement('a');
    if (typeof link.download === 'string') {
      document.body.appendChild(link); //Firefox requires the link to be in the body
      link.download = filename;
      link.href = strData;
      link.click();
      document.body.removeChild(link); //remove the link when done
    } else {
      const win = window.open(strData, "_blank");
      if(!win){
        console.error("Error opening new window");
        return;
      }
      win.document.write("<title>" + filename + "</title><img src='" + strData + "'/>");
    }
  }

}
