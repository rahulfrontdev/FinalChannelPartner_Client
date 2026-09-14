import React, { useEffect, useState } from 'react';
import {
    Modal,
    Box,
    IconButton,
    Button,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Switch,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { getCookie, hasCookie } from 'cookies-next';
import { toast } from 'react-toastify';
import { Baseurl } from '../../Utils/Constants';

const CityMasterModal = ({ open, onClose, stateList }) => {
    const [selectedStateId, setSelectedStateId] = useState('');
    const [cityList, setCityList] = useState([]);
    const [cityName, setCityName] = useState('');
    const [editCityId, setEditCityId] = useState(null);
    const [loadingCities, setLoadingCities] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    const [cityToDelete, setCityToDelete] = useState(null);
    const [citySearch, setCitySearch] = useState('');
    const [bulkToggling, setBulkToggling] = useState(false);

    const getHeader = () => {
        const token = getCookie('token');
        const db_name = getCookie('db_name');
        return {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                db: db_name,
                pass: 'pass',
                'Content-Type': 'application/json',
            },
        };
    };

    const mapCityAvailability = (item) => ({
        ...item,
        is_available:
            item.is_enabled === true ||
            item.is_enabled === 1 ||
            item.is_available === true ||
            item.is_active === true ||
            item.is_active === 1 ||
            item.status === true ||
            item.active === true,
    });

    const fetchCities = async (stateId) => {
        if (!stateId || !hasCookie('token')) {
            setCityList([]);
            return;
        }

        try {
            setLoadingCities(true);
            const res = await axios.get(
                `${Baseurl}/db/area/city?state_id=${stateId}`,
                getHeader()
            );

            const responseData = res.data?.data;
            let cities = [];

            if (Array.isArray(responseData)) {
                cities = responseData;
            } else if (Array.isArray(responseData?.cityData)) {
                cities = responseData.cityData;
            } else if (Array.isArray(res.data)) {
                cities = res.data;
            }

            setCityList(cities.map(mapCityAvailability));
        } catch (error) {
            console.error('Error fetching cities:', error);
            setCityList([]);
            toast.error(error?.response?.data?.message || 'Failed to load cities');
        } finally {
            setLoadingCities(false);
        }
    };

    const resetForm = () => {
        setCityName('');
        setEditCityId(null);
        setDeleteConfirm(false);
        setCityToDelete(null);
    };

    const handleClose = () => {
        resetForm();
        setSelectedStateId('');
        setCityList([]);
        setCitySearch('');
        onClose();
    };

    const getCityId = (city) => city.city_id ?? city.id;

    const filteredCityList = cityList.filter((city) =>
        (city.city_name || '')
            .toLowerCase()
            .includes(citySearch.trim().toLowerCase())
    );

    const allCitiesEnabled =
        cityList.length > 0 && cityList.every((city) => city.is_available);
    const allVisibleCitiesEnabled =
        filteredCityList.length > 0 && filteredCityList.every((city) => city.is_available);

    useEffect(() => {
        if (open && selectedStateId) {
            fetchCities(selectedStateId);
        } else if (!selectedStateId) {
            setCityList([]);
        }
    }, [open, selectedStateId]);

    const handleSaveCity = async () => {
        if (!selectedStateId) {
            return toast.warning('Please select a state');
        }
        if (!cityName.trim()) {
            return toast.warning('Please enter city name');
        }

        if (!hasCookie('token')) return;

        const stateId = Number(selectedStateId);

        try {
            setSaving(true);
            let res;

            if (editCityId) {
                const currentCity = cityList.find(
                    (item) => (item.city_id ?? item.id) === editCityId
                );
                const payload = {
                    city_id: editCityId,
                    city_name: cityName.trim(),
                    state_id: stateId,
                    is_active: currentCity?.is_available ?? true,
                };
                res = await axios.put(`${Baseurl}/db/area/city`, payload, getHeader());
            } else {
                const payload = {
                    city_name: cityName.trim(),
                    state_id: stateId,
                    is_active: true,
                };
                res = await axios.post(`${Baseurl}/db/area/city`, payload, getHeader());
            }

            const isSuccess =
                res.status === 200 ||
                res.status === 201 ||
                res.status === 204 ||
                res.data?.status === 200;

            if (isSuccess) {
                toast.success(
                    res.data?.message ||
                        (editCityId ? 'City updated successfully' : 'City created successfully')
                );
                resetForm();
                fetchCities(selectedStateId);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Something went wrong!');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (city) => {
        setEditCityId(city.city_id ?? city.id);
        setCityName(city.city_name || '');
    };

    const handleDeleteClick = (city) => {
        setCityToDelete(city);
        setDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!cityToDelete || !hasCookie('token')) return;

        const cityId = cityToDelete.city_id ?? cityToDelete.id;

        try {
            setSaving(true);
            const res = await axios.delete(
                `${Baseurl}/db/area/city?ct_id=${cityId}`,
                getHeader()
            );

            const isSuccess =
                res.status === 200 ||
                res.status === 201 ||
                res.status === 204 ||
                res.data?.status === 200;

            if (isSuccess) {
                toast.success(res.data?.message || 'City deleted successfully');
                resetForm();
                fetchCities(selectedStateId);
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Something went wrong!');
        } finally {
            setSaving(false);
            setDeleteConfirm(false);
            setCityToDelete(null);
        }
    };

    const toggleCityAvailability = async (cityId, newAvailability) => {
        setCityList((prev) =>
            prev.map((item) =>
                getCityId(item) === cityId
                    ? { ...item, is_available: newAvailability, is_active: newAvailability }
                    : item
            )
        );

        try {
            // Enable / disable via PATCH /db/area/city
            await axios.patch(
                `${Baseurl}/db/area/city`,
                { city_id: cityId, is_active: newAvailability },
                getHeader()
            );
            return true;
        } catch (error) {
            setCityList((prev) =>
                prev.map((item) =>
                    getCityId(item) === cityId
                        ? { ...item, is_available: !newAvailability, is_active: !newAvailability }
                        : item
                )
            );
            throw error;
        }
    };

    // Enable / Disable All (or visible) cities — single PATCH call (no per-city loop)
    const bulkUpdateCities = async (cities, isActive) => {
        if (!cities.length) {
            toast.info(
                isActive
                    ? 'All cities are already enabled'
                    : 'All cities are already disabled'
            );
            return;
        }

        if (!hasCookie('token') || !selectedStateId) return;

        const idsToUpdate = cities.map(getCityId);
        const idSet = new Set(idsToUpdate);

        setCityList((prev) =>
            prev.map((item) =>
                idSet.has(getCityId(item))
                    ? { ...item, is_available: isActive, is_active: isActive }
                    : item
            )
        );

        setBulkToggling(true);
        try {
            await axios.patch(
                `${Baseurl}/db/area/city`,
                {
                    state_id: Number(selectedStateId),
                    city_id: idsToUpdate,
                    is_active: isActive,
                },
                getHeader()
            );
            toast.success(
                `Cit${cities.length === 1 ? 'y' : 'ies'} ${isActive ? 'enabled' : 'disabled'} successfully`
            );
        } catch (error) {
            setCityList((prev) =>
                prev.map((item) =>
                    idSet.has(getCityId(item))
                        ? { ...item, is_available: !isActive, is_active: !isActive }
                        : item
                )
            );
            toast.error(
                error?.response?.data?.message ||
                    `Failed to ${isActive ? 'enable' : 'disable'} cities`
            );
        } finally {
            setBulkToggling(false);
        }
    };

    const handleToggleCity = async (cityId) => {
        const currentCity = cityList.find((item) => getCityId(item) === cityId);
        if (!currentCity) return;

        const newAvailability = !currentCity.is_available;

        try {
            await toggleCityAvailability(cityId, newAvailability);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to update city status');
        }
    };

    const handleToggleAllCities = async () => {
        const shouldEnable = !allCitiesEnabled;
        await bulkUpdateCities(cityList, shouldEnable);
    };

    const handleToggleVisibleCities = async () => {
        const shouldEnable = !allVisibleCitiesEnabled;
        const citiesToUpdate = filteredCityList.filter(
            (city) => city.is_available !== shouldEnable
        );
        await bulkUpdateCities(citiesToUpdate, shouldEnable);
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box
                sx={{
                    width: 650,
                    bgcolor: 'white',
                    borderRadius: 2,
                    mx: 'auto',
                    mt: '2%',
                    position: 'relative',
                    maxHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    outline: 'none',
                }}
            >
                <IconButton
                    onClick={handleClose}
                    sx={{ position: 'absolute', top: 10, right: 10, color: 'black', zIndex: 1 }}
                >
                    <CloseIcon />
                </IconButton>

                <h3
                    style={{
                        margin: 0,
                        padding: '20px 0',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        borderBottom: '1px solid #eee',
                    }}
                >
                    City Master
                </h3>

                <Box sx={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                    <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                        <InputLabel id="city-master-state-label">State</InputLabel>
                        <Select
                            labelId="city-master-state-label"
                            id="city-master-state"
                            value={selectedStateId}
                            label="State"
                            onChange={(e) => {
                                setSelectedStateId(e.target.value);
                                resetForm();
                                setCitySearch('');
                            }}
                        >
                            <MenuItem value="">
                                <em>Select State</em>
                            </MenuItem>
                            {stateList.map((state) => (
                                <MenuItem key={state.state_id} value={state.state_id}>
                                    {state.state_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="City Name"
                            placeholder="Enter City Name"
                            value={cityName}
                            inputProps={{ maxLength: 100 }}
                            onChange={(e) => setCityName(e.target.value)}
                            disabled={!selectedStateId}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSaveCity}
                            disabled={!selectedStateId || saving}
                            sx={{ minWidth: 90, height: 40 }}
                        >
                            {saving ? '...' : editCityId ? 'Update' : 'Add'}
                        </Button>
                        {editCityId && (
                            <Button
                                variant="outlined"
                                onClick={resetForm}
                                disabled={saving}
                                sx={{ height: 40 }}
                            >
                                Cancel
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '0 20px',
                        minHeight: 200,
                    }}
                >
                    {!selectedStateId ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
                            Please select a state to view cities
                        </p>
                    ) : loadingCities ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
                            Loading cities...
                        </p>
                    ) : cityList.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
                            No cities found for this state
                        </p>
                    ) : (
                        <>
                            <Box sx={{ mb: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Search City"
                                    placeholder="Search city by name"
                                    value={citySearch}
                                    onChange={(e) => setCitySearch(e.target.value)}
                                />
                            </Box>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 1,
                                    mb: 1,
                                    pb: 1,
                                    borderBottom: '1px solid #eee',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Switch
                                        color="primary"
                                        size="small"
                                        checked={allCitiesEnabled}
                                        onChange={handleToggleAllCities}
                                        disabled={bulkToggling}
                                    />
                                    <span style={{ fontSize: 14, fontWeight: 500 }}>
                                        {allCitiesEnabled ? 'Disable All Cities' : 'Enable All Cities'}
                                    </span>
                                </Box>
                                {citySearch.trim() && filteredCityList.length > 0 && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Switch
                                            color="primary"
                                            size="small"
                                            checked={allVisibleCitiesEnabled}
                                            onChange={handleToggleVisibleCities}
                                            disabled={bulkToggling}
                                        />
                                        <span style={{ fontSize: 13 }}>
                                            {allVisibleCitiesEnabled
                                                ? 'Disable Visible'
                                                : 'Enable Visible'}
                                        </span>
                                    </Box>
                                )}
                            </Box>

                            {filteredCityList.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#888', padding: '20px 0' }}>
                                    No cities match your search
                                </p>
                            ) : (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0' }}>
                            {filteredCityList.map((city) => {
                                const id = getCityId(city);
                                return (
                                    <li
                                        key={id}
                                        style={{
                                            padding: '10px 0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid #eee',
                                        }}
                                    >
                                        <span>{city.city_name}</span>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            <Switch
                                                color="primary"
                                                size="small"
                                                checked={!!city.is_available}
                                                onChange={() => handleToggleCity(id)}
                                                title={city.is_available ? 'Disable' : 'Enable'}
                                            />
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => handleEdit(city)}
                                                title="Edit"
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteClick(city)}
                                                title="Delete"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </li>
                                );
                            })}
                        </ul>
                            )}
                        </>
                    )}
                </Box>

                {deleteConfirm && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 2,
                            zIndex: 2,
                        }}
                    >
                        <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 3, width: 320, textAlign: 'center' }}>
                            <p style={{ marginBottom: 16 }}>
                                Are you sure you want to delete <strong>{cityToDelete?.city_name}</strong>?
                            </p>
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => {
                                        setDeleteConfirm(false);
                                        setCityToDelete(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={handleDeleteConfirm}
                                    disabled={saving}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}

                <Box
                    sx={{
                        borderTop: '1px solid #eee',
                        p: 2,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        bgcolor: 'white',
                    }}
                >
                    <Button variant="contained" color="primary" onClick={handleClose}>
                        Close
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};

export default CityMasterModal;
