import * as THREE from 'three'

export type SpatialSoundParams = {
  loop?: boolean
  autoplay?: boolean
  volume?: number
  playbackRate?: number
  refDistance?: number
  rolloffFactor?: number
  maxDistance?: number
  coneInnerAngle?: number
  coneOuterAngle?: number
  coneOuterGain?: number
  debugColor?: THREE.ColorRepresentation
}

export class SpatialSound {
  static listener: THREE.AudioListener = new THREE.AudioListener()
  private sound: THREE.PositionalAudio
  private isLoaded: boolean = false
  private url: string
  private loop: boolean = false
  private autoplay: boolean = false

  private initOptions: SpatialSoundParams

  debugSphere: THREE.Mesh = null!

  /**
   * Creates a new spatial sound that can be positioned in 3D space
   * @param listener The THREE.AudioListener associated with the camera
   * @param url The URL of the sound file to load
   */
  constructor(
    url: string,
    options: SpatialSoundParams = {
      loop: false,
      autoplay: false,
      debugColor: Math.random() * 0xffffff,
    }
  ) {
    if (!SpatialSound.listener) {
      throw new Error(
        'AudioListener is not set. Please set it before creating SpatialSound.'
      )
    }
    this.initOptions = options
    this.loop = options.loop ?? false
    this.autoplay = options.autoplay ?? false
    this.url = url
    this.sound = new THREE.PositionalAudio(this.listener)

    this.loadSound()

    const debugSphere = new THREE.SphereGeometry(0.1, 16, 16)
    const debugMaterial = new THREE.MeshStandardMaterial({
      color: options.debugColor,
      emissive: options.debugColor,
    })
    const debugMesh = new THREE.Mesh(debugSphere, debugMaterial)
    this.debugSphere = debugMesh
    this.debugSphere.visible = false
    this.debugSphere.position.set(0, 0, 0)
  }

  get listener() {
    return SpatialSound.listener
  }

  unmuteAllAudioElements = () => {
    this.listener.context.resume()
    
    console.log('Audio context resumed')

    // reset all settings
    // this.listener.setMasterVolume(1)
    this.sound.setVolume(parseFloat((this.initOptions.volume ?? 1).toFixed(2)))
    this.sound.setPlaybackRate(this.initOptions.playbackRate ?? 1)
    this.sound.setRefDistance(this.initOptions.refDistance ?? 1)
    this.sound.setRolloffFactor(this.initOptions.rolloffFactor ?? 1)
    this.sound.setMaxDistance(this.initOptions.maxDistance ?? 100)
    this.sound.setDistanceModel('exponential')

    // Resume audio context
    console.log(this.sound.getVolume())
    console.log(this.sound.getRolloffFactor())
    console.log(this.sound.getMaxDistance())
    console.log(this.sound.getDistanceModel())

    document.removeEventListener('click', this.unmuteAllAudioElements)
    document.removeEventListener('touchstart', this.unmuteAllAudioElements)
  }

  static attachListenerToCamera(camera: THREE.Camera): void {
    if (!SpatialSound.listener) {
      SpatialSound.listener = new THREE.AudioListener()
    }
    camera.add(SpatialSound.listener)
  }

  /**
   * Loads the sound file
   */
  private loadSound(): void {
    const audioLoader = new THREE.AudioLoader()
    audioLoader.load(this.url, (buffer) => {
      this.sound.setBuffer(buffer)
      this.sound.setLoop(this.loop)
      this.sound.setVolume(this.initOptions.volume ?? 1)
      this.sound.setPlaybackRate(this.initOptions.playbackRate ?? 1)
      this.sound.setRefDistance(this.initOptions.refDistance ?? 1)
      this.sound.setRolloffFactor(this.initOptions.rolloffFactor ?? 1)
      this.sound.setMaxDistance(this.initOptions.maxDistance ?? 100)

      this.sound.setDistanceModel('exponential')
      // this.sound.setAttenuationDistance(this.initOptions.refDistance ?? 1, this.initOptions.maxDistance ?? 100);
      this.isLoaded = true

      if (this.autoplay) {
        this.play()
        if (this.listener.context.state === 'suspended') {
          // listen to interactions on document to unmute all audio elements
          document.addEventListener('click', this.unmuteAllAudioElements)
          document.addEventListener('touchstart', this.unmuteAllAudioElements)
        }
      }
    })
  }

  /**
   * Adds the sound to a THREE.Object3D (like a mesh)
   * @param parent The object to attach the sound to
   */
  public addToObject(parent: THREE.Object3D): void {
    parent.add(this.sound)
    parent.add(this.debugSphere)
    this.debugSphere.position.set(this.sound.position.x, this.sound.position.y, this.sound.position.z)
  }

  isTransitioning: boolean = false  
  public transitionIn (){
      const frames = 1000 / 60
      const desiredVolume = this.initOptions.volume ?? 1
      this.sound.setVolume(0)
      this.isTransitioning = true
      let i = setInterval(() => {
        if (this.sound.getVolume() < desiredVolume) {
          this.sound.setVolume(this.sound.getVolume() + 0.01)
        } else {
          clearInterval(i)
          this.isTransitioning = false
        }
      }, frames)
    }
  public transitionOut (){
      const frames = 1000 / 60
      const desiredVolume = 0
      this.isTransitioning = true
      let i = setInterval(() => {
        if (this.sound.getVolume() > desiredVolume) {
          this.sound.setVolume(Math.max(0,this.sound.getVolume() - 0.01))
        } else {
          this.isTransitioning = false
          clearInterval(i)
        }
      }, frames)
    }

  /**
   * Sets the 3D position of the sound
   * @param x X position
   * @param y Y position
   * @param z Z position
   */
  public setPosition(x: number, y: number, z: number): void {
    this.sound.position.set(x, y, z)
    this.debugSphere.position.set(this.sound.position.x, this.sound.position.y, this.sound.position.z)
  }

  /**
   * Sets whether the sound should loop (repeat)
   * @param loop True to repeat, false for one-shot sound
   */
  public setLoop(loop: boolean): void {
    this.loop = loop
    if (this.isLoaded) {
      this.sound.setLoop(loop)
    }
  }

  /**
   * Sets whether the sound should play automatically once loaded
   * @param autoplay True to play automatically
   */
  public setAutoplay(autoplay: boolean): void {
    this.autoplay = autoplay
  }

  /**
   * Sets the volume of the sound
   * @param volume Value from 0 to 1
   */
  public setVolume(volume: number): void {
    this.sound.setVolume(volume)
  }

  /**
   * Sets the playback rate of the sound
   * @param rate Playback rate, normal = 1
   */
  public setPlaybackRate(rate: number): void {
    this.sound.setPlaybackRate(rate)
  }

  /**
   * Sets the ref distance - distance at which the volume reduction is half
   * @param distance Distance value
   */
  public setRefDistance(distance: number): void {
    this.sound.setRefDistance(distance)
  }

  /**
   * Sets the rolloff factor - how quickly the sound attenuates with distance
   * @param rolloff Rolloff factor
   */
  public setRolloffFactor(rolloff: number): void {
    this.sound.setRolloffFactor(rolloff)
  }

  /**
   * Sets the max distance after which the sound won't attenuate further
   * @param distance Max distance
   */
  public setMaxDistance(distance: number): void {
    this.sound.setMaxDistance(distance)
  }


  /**
   * Plays the sound
   */
  public play(): void {
    if (this.isLoaded) {
      this.sound.play()
    } else {
      this.autoplay = true
    }
  }

  /**
   * Stops the sound
   */
  public stop(): void {
    if (this.isLoaded && this.sound.isPlaying) {
      this.sound.stop()
    }
    this.autoplay = false
  }

  /**
   * Pauses the sound
   */
  public pause(): void {
    if (this.isLoaded && this.sound.isPlaying) {
      this.sound.pause()
    }
  }

  /**
   * Returns whether the sound is currently playing
   */
  public isPlaying(): boolean {
    return this.sound.isPlaying
  }

  /**
   * Returns whether the sound has finished loading
   */
  public isReady(): boolean {
    return this.isLoaded
  }

  /**
   * Gets the underlying THREE.PositionalAudio object
   */
  public getSound(): THREE.PositionalAudio {
    return this.sound
  }
}

export default SpatialSound
