import { useEffect, useState } from 'react';
import './App.css';
import MainMenu from './components/MainMenu';
import CardGallery from './components/CardGallery';
import GameScreen from './components/GameScreen';
import { preloadCatalogSprites } from './utils/cardSpritePreload';

function App() {
  const [screen, setScreen] = useState('menu');

  useEffect(() => {
    preloadCatalogSprites().catch(() => {});
  }, []);

  return (
    <div className="app">
      {screen === 'menu' && (
        <MainMenu
          onNewGame={() => {
            preloadCatalogSprites();
            setScreen('game');
          }}
          onGallery={() => setScreen('gallery')}
        />
      )}
      {screen === 'gallery' && <CardGallery onBack={() => setScreen('menu')} />}
      {screen === 'game' && <GameScreen onBack={() => setScreen('menu')} />}
    </div>
  );
}

export default App;
