import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';
import { Baseurl } from './Constants';
import { toast } from 'react-toastify';

export async function fetchData(url, setData, errorToast, setErrorToast, bypass = false) {
    if (hasCookie('token') || bypass) {
        const token = getCookie('token');
        const db_name = getCookie('db_name');

        const header = {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                db: db_name,
                pass: 'pass',
            },
        };

        try {
            const response = await axios.get(Baseurl + url, header);
            console.log("vvv", response)
            if (typeof setData === 'function') {
                setData(response?.data?.data);
            }
        } catch (error) {
            if (!errorToast) {
                console.log(error?.response?.data?.message || 'Something went wrong!');
                if (typeof setErrorToast === 'function') {
                    setErrorToast(!errorToast);
                }
            }
        }
    }
}
