import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/authContext'
import { doSignOut } from '../../firebase/auth'
import Logo from "../../components/Logo/logo";

const Header = () => {
    const navigate = useNavigate()
    const { userLoggedIn } = useAuth()
    return (
        <nav className='flex flex-row gap-x-2 w-full z-20 fixed top-0 left-0 h-12 border-b place-content-center items-center bg-gray-200'>
            <Logo />
            {
                userLoggedIn
                    ?
                    <>
                        <Link className='text-sm text-white-600' to={'/home'}>Inicio</Link>
                        <button onClick={() => { doSignOut().then(() => { navigate('/login') }) }} className='text-sm text-white-600'>Salir de la cuenta</button>
                    </>
                    :
                    <>
                        <Link className='text-sm text-blue-600 underline' to={'/login'}>Ingresar</Link>
                        <Link className='text-sm text-blue-600 underline' to={'/register'}>Registrar nueva cuenta</Link>
                    </>
            }

        </nav>
    )
}

export default Header