import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export interface AssetLoadProgress {
  url: string;
  loaded: number;
  total: number;
  percent: number;
}

export interface ClonedModelInstance {
  root: THREE.Group;
  animations: THREE.AnimationClip[];
  isFallback: boolean;
}

export class AssetManager {
  private static instance: AssetManager;
  private gltfLoader: GLTFLoader;
  private loadingManager: THREE.LoadingManager;
  private cache: Map<string, GLTF> = new Map();
  private pending: Map<string, Promise<GLTF>> = new Map();
  private fallbackCache: Map<string, THREE.Group> = new Map();

  public onProgress?: (progress: AssetLoadProgress) => void;
  public onError?: (url: string, error: any) => void;

  private constructor() {
    this.loadingManager = new THREE.LoadingManager(
      () => {},
      (item, loaded, total) => {
        if (this.onProgress) {
          this.onProgress({
            url: item,
            loaded,
            total,
            percent: total > 0 ? (loaded / total) * 100 : 100,
          });
        }
      },
      (url) => {
        console.warn(`[AssetManager] Error loading resource: ${url}`);
        if (this.onError) this.onError(url, 'LoadingManager failed');
      }
    );

    this.gltfLoader = new GLTFLoader(this.loadingManager);
  }

  public static getInstance(): AssetManager {
    if (!AssetManager.instance) {
      AssetManager.instance = new AssetManager();
    }
    return AssetManager.instance;
  }

  /**
   * Load a GLTF/GLB asset with caching and in-flight deduplication.
   */
  public async loadGLTF(url: string): Promise<GLTF> {
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    if (this.pending.has(url)) {
      return this.pending.get(url)!;
    }

    const promise = new Promise<GLTF>((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.cache.set(url, gltf);
          this.pending.delete(url);
          resolve(gltf);
        },
        undefined,
        (err) => {
          this.pending.delete(url);
          console.warn(`[AssetManager] Could not load GLB from ${url}. Using procedural fallback. Error:`, err);
          if (this.onError) this.onError(url, err);
          reject(err);
        }
      );
    });

    this.pending.set(url, promise);
    return promise;
  }

  /**
   * Safe clone of a loaded model using SkeletonUtils for skinned meshes.
   * If the model cannot be loaded, returns a procedural fallback model.
   */
  public async instantiateModel(url: string, fallbackType: 'character' | 'prop' | 'tree' = 'prop'): Promise<ClonedModelInstance> {
    try {
      const gltf = await this.loadGLTF(url);
      // SkeletonUtils.clone properly clones bones, skins, and hierarchy
      const clonedScene = SkeletonUtils.clone(gltf.scene) as THREE.Group;
      
      // Ensure shadow casting and receiving is enabled on all child meshes
      clonedScene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      return {
        root: clonedScene,
        animations: gltf.animations || [],
        isFallback: false,
      };
    } catch {
      // Return procedural fallback
      const fallbackRoot = this.createProceduralFallback(fallbackType, url);
      return {
        root: fallbackRoot,
        animations: [],
        isFallback: true,
      };
    }
  }

  /**
   * Get cached animation clips for a URL if loaded
   */
  public getAnimations(url: string): THREE.AnimationClip[] {
    const cached = this.cache.get(url);
    return cached?.animations || [];
  }

  /**
   * Preload a list of asset URLs
   */
  public async preloadAssets(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map(url => this.loadGLTF(url)));
  }

  /**
   * Generate an aesthetically pleasing procedural fallback when an asset file is unavailable
   */
  private createProceduralFallback(type: 'character' | 'prop' | 'tree', id: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `fallback_${type}_${id}`;

    if (type === 'character') {
      const isLumi = id.includes('lumi');
      const color = isLumi ? 0xf28b9d : 0x56c5d5;
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4 });
      const headMat = new THREE.MeshStandardMaterial({ color: 0xffe0bd, roughness: 0.5 });
      
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 8, 16), bodyMat);
      body.position.y = 0.6;
      body.castShadow = true;
      group.add(body);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), headMat);
      head.position.y = 1.2;
      head.castShadow = true;
      group.add(head);
    } else if (type === 'tree') {
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6e472a, roughness: 0.8 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x5da85d, roughness: 0.6 });
      
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.5, 8), trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      group.add(trunk);

      const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 1), foliageMat);
      foliage.position.y = 3.0;
      foliage.castShadow = true;
      group.add(foliage);
    } else {
      const propMat = new THREE.MeshStandardMaterial({ color: 0xa8a8b2, roughness: 0.7 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), propMat);
      box.position.y = 0.4;
      box.castShadow = true;
      group.add(box);
    }

    return group;
  }
}

export const assetManager = AssetManager.getInstance();
