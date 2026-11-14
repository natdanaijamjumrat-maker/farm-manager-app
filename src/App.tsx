import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { isRoute, type RouteId } from './routes';
import { Dashboard } from './pages/Dashboard';
import { Crops } from './pages/Crops';
import { Batches } from './pages/Batches';
import { Logs } from './pages/Logs';
import { Photos } from './pages/Photos';
import { Harvest } from './pages/Harvest';
import { Farms, Greenhouses, Systems } from './pages/Setup';
import { Inventory } from './pages/Inventory';
import { Finance } from './pages/Finance';
import { Nutrients } from './pages/Nutrients';
import { Environment } from './pages/Environment';
import { Analytics } from './pages/Analytics';

/** Hash routing (#batches, #logs …) keeps the prototype a single static page.
 *  When moving to production this can be swapped for react-router. */
const readHash = (): RouteId => {
  const h = window.location.hash.replace('#', '');
  return isRoute(h) ? h : 'dashboard';
};

export default function App() {
  const [route, setRoute] = useState<RouteId>(readHash);
  useEffect(() => {
    const on = () => setRoute(readHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  const go = (r: RouteId) => {
    if (window.location.hash !== `#${r}`) window.location.hash = r;
    setRoute(r);
    window.scrollTo({ top: 0 });
  };

  const page = (() => {
    switch (route) {
      case 'dashboard': return <Dashboard go={go} />;
      case 'farms': return <Farms />;
      case 'greenhouses': return <Greenhouses go={go} />;
      case 'systems': return <Systems go={go} />;
      case 'crops': return <Crops />;
      case 'batches': return <Batches go={go} />;
      case 'logs': return <Logs go={go} />;
      case 'nutrients': return <Nutrients />;
      case 'environment': return <Environment go={go} />;
      case 'photos': return <Photos go={go} />;
      case 'harvest': return <Harvest go={go} />;
      case 'inventory': return <Inventory />;
      case 'finance': return <Finance />;
      case 'analytics': return <Analytics go={go} />;
    }
  })();

  return <Layout route={route} go={go}>{page}</Layout>;
}
