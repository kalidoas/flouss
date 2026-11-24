import { useEffect, useRef, useState } from 'react';
import type { Locale } from './copy';

type Props = { locale: Locale; dir: 'rtl' | 'ltr' };

function makeCardTexture(THREE: typeof import('three'), locale: Locale, dir: 'rtl' | 'ltr', kind: 'main' | 'goal' | 'activity') {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 1000;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');
  const rtl = dir === 'rtl';
  const main = kind === 'main';
  const isAr = locale === 'ar';
  const labels = locale === 'ar'
    ? { balance: 'الرصيد المتاح', activity: 'آخر الحركات', groceries: 'مشتريات', today: 'اليوم', goal: 'عطلة الصيف', goalLabel: 'هدف الادخار' }
    : locale === 'fr'
      ? { balance: 'Solde disponible', activity: 'Activité récente', groceries: 'Courses', today: 'Aujourd’hui', goal: 'Vacances d’été', goalLabel: 'Objectif d’épargne' }
      : { balance: 'Available balance', activity: 'Recent activity', groceries: 'Groceries', today: 'Today', goal: 'Summer trip', goalLabel: 'Savings goal' };

  context.fillStyle = '#ffffff';
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, 48);
  context.fill();
  context.direction = dir;
  context.textAlign = rtl ? 'right' : 'left';
  const x = rtl ? 610 : 64;

  if (main) {
    context.fillStyle = '#087f5b';
    context.beginPath();
    context.roundRect(56, 56, 116, 116, 34);
    context.fill();
    context.fillStyle = '#ffffff';
    context.font = '700 58px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('ف', 114, 132);
    context.textAlign = rtl ? 'right' : 'left';
    context.fillStyle = '#183a2e';
    context.font = '700 42px system-ui, sans-serif';
    context.fillText('Flouss', rtl ? 590 : 194, 130);
    context.fillStyle = '#73847a';
    context.font = `${isAr ? '500 29px' : '500 25px'} system-ui, sans-serif`;
    context.fillText(labels.balance, x, 286);
    context.fillStyle = '#153d30';
    context.font = '700 76px system-ui, sans-serif';
    context.fillText(locale === 'en' ? '8,450' : '8 450', x, 382);
    context.fillStyle = '#718179';
    context.font = '500 27px system-ui, sans-serif';
    context.textAlign = rtl ? 'left' : 'right';
    context.fillText('MAD', rtl ? 58 : 642, 377);
    context.fillStyle = '#e6ece6';
    context.fillRect(58, 440, 584, 2);
    context.textAlign = rtl ? 'right' : 'left';
    context.fillStyle = '#173b30';
    context.font = '600 27px system-ui, sans-serif';
    context.fillText(labels.activity, x, 512);
    drawTransaction(context, { rtl, y: 608, title: labels.groceries, subtitle: labels.today, amount: '−120', tone: '#e8f4eb' });
    drawTransaction(context, { rtl, y: 756, title: locale === 'ar' ? 'قهوة' : locale === 'fr' ? 'Café' : 'Coffee', subtitle: labels.today, amount: '−28', tone: '#fff1df' });
    context.fillStyle = '#edf5ee';
    context.beginPath();
    context.roundRect(58, 850, 584, 92, 24);
    context.fill();
    context.fillStyle = '#476b59';
    context.font = '500 25px system-ui, sans-serif';
    context.fillText(locale === 'ar' ? 'هدف الشهر' : locale === 'fr' ? 'Objectif du mois' : 'This month’s goal', x, 907);
    return new THREE.CanvasTexture(canvas);
  }

  context.fillStyle = kind === 'goal' ? '#edf5ee' : '#f5f7f4';
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, 48);
  context.fill();
  context.fillStyle = '#6e7c73';
  context.font = '500 31px system-ui, sans-serif';
  context.fillText(kind === 'goal' ? labels.goalLabel : labels.activity, x, 130);
  if (kind === 'goal') {
    context.strokeStyle = '#d1e5d7';
    context.lineWidth = 34;
    context.beginPath();
    context.arc(350, 470, 185, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = '#087f5b';
    context.lineCap = 'round';
    context.beginPath();
    context.arc(350, 470, 185, -Math.PI / 2, Math.PI * 0.1);
    context.stroke();
    context.fillStyle = '#153d30';
    context.font = '700 68px system-ui, sans-serif';
    context.textAlign = 'center';
    context.fillText('64%', 350, 490);
    context.textAlign = rtl ? 'right' : 'left';
    context.fillStyle = '#173b30';
    context.font = '650 35px system-ui, sans-serif';
    context.fillText(labels.goal, x, 790);
    context.fillStyle = '#718179';
    context.font = '500 28px system-ui, sans-serif';
    context.fillText(locale === 'ar' ? '3 200 د.م.' : '3,200 MAD', x, 852);
  } else {
    drawTransaction(context, { rtl, y: 280, title: labels.groceries, subtitle: labels.today, amount: '−120', tone: '#e8f4eb' });
    drawTransaction(context, { rtl, y: 450, title: locale === 'ar' ? 'قهوة' : locale === 'fr' ? 'Café' : 'Coffee', subtitle: labels.today, amount: '−28', tone: '#fff1df' });
    drawTransaction(context, { rtl, y: 620, title: locale === 'ar' ? 'فاتورة' : locale === 'fr' ? 'Facture' : 'Bill', subtitle: labels.today, amount: '−340', tone: '#eef0fa' });
  }
  return new THREE.CanvasTexture(canvas);
}

function drawTransaction(context: CanvasRenderingContext2D, item: { rtl: boolean; y: number; title: string; subtitle: string; amount: string; tone: string }) {
  const x = item.rtl ? 610 : 90;
  context.fillStyle = item.tone;
  context.beginPath();
  context.arc(item.rtl ? 594 : 106, item.y - 20, 38, 0, Math.PI * 2);
  context.fill();
  context.textAlign = item.rtl ? 'right' : 'left';
  context.fillStyle = '#203b31';
  context.font = '600 28px system-ui, sans-serif';
  context.fillText(item.title, x, item.y - 27);
  context.fillStyle = '#78877e';
  context.font = '400 23px system-ui, sans-serif';
  context.fillText(item.subtitle, x, item.y + 12);
  context.textAlign = item.rtl ? 'left' : 'right';
  context.fillStyle = '#344b40';
  context.font = '600 25px system-ui, sans-serif';
  context.fillText(item.amount, item.rtl ? 86 : 614, item.y - 14);
}

function roundedShape(THREE: typeof import('three'), width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const top = height / 2;
  const bottom = -height / 2;
  shape.moveTo(left + radius, bottom);
  shape.lineTo(right - radius, bottom);
  shape.quadraticCurveTo(right, bottom, right, bottom + radius);
  shape.lineTo(right, top - radius);
  shape.quadraticCurveTo(right, top, right - radius, top);
  shape.lineTo(left + radius, top);
  shape.quadraticCurveTo(left, top, left, top - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  return shape;
}

export function HeroFlight({ locale, dir }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobileAtLoad = window.matchMedia('(max-width: 720px)').matches;
    if (reduceMotion || mobileAtLoad) return;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    let active = true;
    let inView = false;
    let started = false;
    let raf = 0;
    let renderer: import('three').WebGLRenderer | undefined;
    let scene: import('three').Scene | undefined;
    let camera: import('three').PerspectiveCamera | undefined;
    let cleanupResize: (() => void) | undefined;
    let idleHandle: number | undefined;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const resources: Array<{ dispose: () => void }> = [];

    const draw = () => {
      if (!active || !inView || window.matchMedia('(max-width: 720px)').matches || !renderer || !scene || !camera) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (active && inView && renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      });
    };

    const updateMotion = () => {
      if (!active || !inView || window.matchMedia('(max-width: 720px)').matches || !section || !camera) return;
      const bounds = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1)));
      camera.position.z = 10.5 - progress * 0.7;
      camera.position.y = progress * 0.24;
      const group = scene?.children[0];
      if (group) {
        group.rotation.y = progress * 0.16;
        group.rotation.x = progress * 0.04;
      }
      draw();
    };

    const init = async () => {
      if (!active || !inView || window.matchMedia('(max-width: 720px)').matches) {
        started = false;
        return;
      }
      const THREE = await import('three');
      if (!active || !inView || window.matchMedia('(max-width: 720px)').matches) {
        started = false;
        return;
      }
      const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
      if (!context) return;

      renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.setSize(section.clientWidth, section.clientHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, section.clientWidth / section.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 10.5);

      const group = new THREE.Group();
      scene.add(group);
      const addCard = (kind: 'main' | 'goal' | 'activity', width: number, height: number, position: [number, number, number], rotation: [number, number, number], zIndex: number) => {
        const cardGeometry = new THREE.ShapeGeometry(roundedShape(THREE, width, height, 0.16), 8);
        const shadowGeometry = new THREE.ShapeGeometry(roundedShape(THREE, width * 1.02, height * 1.01, 0.18), 8);
        const vertices = cardGeometry.attributes.position;
        const uvs = cardGeometry.attributes.uv;
        for (let index = 0; index < vertices.count; index += 1) {
          uvs.setXY(index, (vertices.getX(index) + width / 2) / width, (vertices.getY(index) + height / 2) / height);
        }
        uvs.needsUpdate = true;
        const texture = makeCardTexture(THREE, locale, dir, kind);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer!.capabilities.getMaxAnisotropy();
        const shadow = new THREE.Mesh(shadowGeometry, new THREE.MeshBasicMaterial({ color: 0x234838, transparent: true, opacity: 0.1 }));
        shadow.position.set(position[0] + 0.08, position[1] - 0.1, position[2] - 0.06);
        shadow.rotation.set(...rotation);
        const card = new THREE.Mesh(cardGeometry, new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
        card.position.set(...position);
        card.rotation.set(...rotation);
        card.renderOrder = zIndex;
        shadow.renderOrder = zIndex - 1;
        group.add(shadow, card);
        resources.push(cardGeometry, shadowGeometry, texture, card.material, shadow.material);
        return card;
      };

      const main = addCard('main', 3.2, 4.65, [0.1, -0.02, 0.2], [-0.06, -0.12, -0.1], 3);
      const goal = addCard('goal', 1.78, 2.45, [1.65, -1.05, 0.7], [-0.12, 0.17, 0.08], 4);
      const activity = addCard('activity', 1.62, 2.25, [-1.76, 1.15, 0.3], [0.1, -0.16, -0.08], 2);

      const media = window.matchMedia('(max-width: 720px)');
      const updateLayout = () => {
        if (!renderer || !camera) return;
        const width = section.clientWidth;
        const height = section.clientHeight;
        const mobile = media.matches;
        if (mobile) {
          setSceneReady(false);
          return;
        }
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.4 : 1.75));
        camera.aspect = width / height;
        camera.fov = mobile ? 38 : 32;
        camera.position.z = mobile ? 12 : 10.5;
        camera.updateProjectionMatrix();
        main.position.x = mobile ? 0 : 0.1;
        main.scale.setScalar(mobile ? 0.86 : 1);
        goal.position.set(mobile ? 1.3 : 1.65, mobile ? -1.55 : -1.05, 0.7);
        goal.scale.setScalar(mobile ? 0.83 : 1);
        activity.position.set(mobile ? -1.35 : -1.76, mobile ? 1.43 : 1.15, 0.3);
        activity.scale.setScalar(mobile ? 0.82 : 1);
        draw();
      };
      const resize = new ResizeObserver(updateLayout);
      resize.observe(section);
      media.addEventListener('change', updateLayout);
      window.addEventListener('scroll', updateMotion, { passive: true });
      updateLayout();

      setSceneReady(true);
      updateMotion();

      return () => {
        resize.disconnect();
        media.removeEventListener('change', updateLayout);
        window.removeEventListener('scroll', updateMotion);
      };
    };

    const startOnScroll = () => {
      if (!active || !inView || started) return;
      started = true;
      const start = () => {
        void init().then((cleanup) => { cleanupResize = cleanup; }).catch(() => {
          if (active) setSceneReady(false);
        });
      };
      if (idleWindow.requestIdleCallback) idleHandle = idleWindow.requestIdleCallback(start, { timeout: 1200 });
      else timeoutHandle = setTimeout(start, 180);
    };

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) {
        draw();
        if (window.scrollY > 0) startOnScroll();
      } else {
        cancelAnimationFrame(raf);
      }
    }, { threshold: 0.05 });
    observer.observe(section);
    window.addEventListener('scroll', startOnScroll, { passive: true });

    return () => {
      active = false;
      observer.disconnect();
      window.removeEventListener('scroll', startOnScroll);
      cleanupResize?.();
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timeoutHandle !== undefined) clearTimeout(timeoutHandle);
      cancelAnimationFrame(raf);
      resources.forEach((resource) => resource.dispose());
      renderer?.dispose();
      setSceneReady(false);
    };
  }, [dir, locale]);

  return (
    <div className={`hero-flight${sceneReady ? ' is-ready' : ''}`} ref={sectionRef} aria-hidden="true">
      <img className="hero-flight__poster" src="/images/hero-poster.svg" alt="" />
      <canvas className="hero-flight__canvas" ref={canvasRef} />
    </div>
  );
}
