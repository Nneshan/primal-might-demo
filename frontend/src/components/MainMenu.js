import { GAME_TITLE } from '../constants';
import './MainMenu.css';

function MainMenu({ onNewGame, onGallery }) {
  return (
    <div className="main-menu">
      <h1 className="main-menu-title">{GAME_TITLE}</h1>
      <p className="main-menu-subtitle">Коллекционная карточная игра</p>
      <nav className="main-menu-actions">
        <button type="button" className="main-menu-btn" onClick={onNewGame}>
          Новая игра
        </button>
        <button type="button" className="main-menu-btn" onClick={onGallery}>
          Галерея карт
        </button>
      </nav>
    </div>
  );
}

export default MainMenu;
