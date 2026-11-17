import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/globals.css'
import '../styles/styles.css'
import '../styles/style.css'
import '../styles/styleguide.css'
import '../styles/channelstyles.css'
import { store } from '../store/store'
import { Provider } from 'react-redux'
import { SSRProvider } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';

const showErrorToast = toast.error.bind(toast);
toast.error = (message, options) =>
  showErrorToast(message, { ...(options || {}), autoClose: 8000 });
import 'react-toastify/dist/ReactToastify.css';
import Layout from '../Components/layout/layout';
import Tabs from '../Components/DMS/Tabs/Tabs';
import { hasCookie } from 'cookies-next';
import { Fragment } from 'react';
import dynamic from "next/dynamic";
import Kloudmart from '../Components/DMS/LandingPageDMS/Kloudmart';


function App({ Component, pageProps }) {
  return (
    <>
  
      
      <Provider store={store}>
        <SSRProvider>
        <ToastContainer
                  position="top-right"
                  autoClose={500}
                  limit={1}
                  newestOnTop={false} 
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light" />
      {/* {hasCookie("dms") ? <Kloudmart/>  : <Fragment></Fragment> }   */} 
        <Layout Component={Component} pageProps={pageProps}  />
      {/* {hasCookie("dms") ? <Tabs/>  : <Fragment></Fragment> }   */}
      {/* the kloudmart and tabs component will come according to role (distributor) */}
        </SSRProvider>
      </Provider>
  </>
  )

}


export default dynamic(()=>Promise.resolve(App),{ssr:false})

// export default App;