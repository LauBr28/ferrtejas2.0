import React from 'react';
import imageUrl from './logo.png';
import './logo.css';

const Logo = () => {

    return (
        <div className="logoclass">
            <img id="logo"style={{ paddingTop: '5px' }} src={imageUrl} alt='logo' />
        </div>
    );
}

export default Logo;
