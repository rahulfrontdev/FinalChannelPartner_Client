import React from 'react';
import { Modal, Table } from 'react-bootstrap';

const VisitHistoryModel = ({
  show,
  setShow,
  visitHistory,
  showScheduleActivationColumns = false,
  // legacy alias (BST-only callers)
  isBstProfile = false,
}) => {
    const showScheduleColumns = showScheduleActivationColumns || isBstProfile;

    function formatTime(timeString) {
        if (!timeString) return '';
        const timeParts = String(timeString).split(':');
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return String(timeString);

        const date = new Date(2000, 0, 1, hours, minutes);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    function formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    }

    const emptyColSpan = showScheduleColumns ? 7 : 4;

    return (
        <Modal show={show} onHide={() => setShow(false)} size="xl" top>
            <Modal.Header closeButton>
                <Modal.Title>{showScheduleColumns ? 'Visit History' : 'Revisits History'}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>SN</th>
                            {showScheduleColumns ? (
                                <>
                                    <th>Scheduled Date</th>
                                    <th>Scheduled Time</th>
                                    <th>Activation Date</th>
                                    <th>Activation Time</th>
                                    <th>Project Name</th>
                                </>
                            ) : (
                                <>
                                    <th>Revisit Date</th>
                                    <th>Revisit Time</th>
                                </>
                            )}
                            <th>Remark</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visitHistory.length > 0 ? (
                            visitHistory.map((visit, index) => (
                                <tr key={index}>
                                    <td>{index + 1}</td>
                                    {showScheduleColumns ? (
                                        <>
                                            <td>
                                                {formatDate(
                                                    visit?.scheduled_date || visit?.revisit_date
                                                )}
                                            </td>
                                            <td>
                                                {formatTime(
                                                    visit?.scheduled_time || visit?.revisit_time
                                                )}
                                            </td>
                                            <td>{formatDate(visit?.activation_date)}</td>
                                            <td>{formatTime(visit?.activation_time)}</td>
                                            <td>{visit?.project_name || ''}</td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{visit?.revisit_date ? formatDate(visit?.revisit_date) : ''}</td>
                                            <td>{visit?.revisit_time ? formatTime(visit?.revisit_time) : ''}</td>
                                        </>
                                    )}
                                    <td>{visit?.remark || ''}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={emptyColSpan} className="text-center">
                                    No visit history available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Modal.Body>
        </Modal>
    );
};

export default VisitHistoryModel;
