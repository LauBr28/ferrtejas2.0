import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/authContext';
import { doSignOut } from '../../firebase/auth';

const Header = () => {
    const navigate = useNavigate();
    const { userLoggedIn } = useAuth();
    return (
        <nav className='flex flex-row justify-between gap-x-2 w-3/4 lg:w-2/3 mx-auto z-20 fixed top-4 left-0 right-0 h-12 border-b border-gray-300 bg-white/30 backdrop-blur-md shadow-lg rounded-full items-center px-4'>
            {
                userLoggedIn
                    ?
                    <>
                        <Link className='text-lg' to={'/home'}>
                            <span className='font-bold'>Ferretejas</span> <span className='font-bold text-gray-400'>App</span>
                        </Link>
                        <button
                            onClick={() => { doSignOut().then(() => { navigate('/login') }) }}
                            className='text-x1 bg-indigo-600 text-gray-100 px-4 py-1 rounded-full hover:shadow-xl transition duration-300'>
                            Log Out
                        </button>
                    </>
                    :
                    <>
                        <Link className='text-lg' to={'/login'}>
                            <span className='font-bold'>Ferretejas</span> <span className='font-bold text-gray-400'>App</span>
                        </Link>
                        <Link className='text-x1 text-gray-1000' to={'/aboutUs'}>
                            About us
                        </Link>
                        <Link
                            className='text-x1 bg-indigo-600 text-gray-100 px-4 py-1 rounded-full hover:shadow-xl transition duration-300'
                            to={'/register'}>
                            Sign Up
                        </Link>
                    </>
            }
        </nav>
    );
}

export default Header;
