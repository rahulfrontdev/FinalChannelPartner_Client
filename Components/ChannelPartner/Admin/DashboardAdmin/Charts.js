// import React from 'react'
// import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip ,head } from 'recharts';
// const Charts = ({dataList, keyX='lead', keyY='booking'}) => {
//     return (
//         <>

//        {dataList && dataList.length > 0 ? 
//         <ResponsiveContainer width='120%' height={350}>
//             <BarChart data={dataList} width={80} height={90} isAnimationActive={true} >
//                 <XAxis dataKey="date"/>
//                 <YAxis />
//                 <Tooltip />
//                 <Bar dataKey={keyX} fill="#8884d8" />
//                 <Bar dataKey={keyY} fill="#82ca9d" />
//             </BarChart>
//         </ResponsiveContainer> : <></>}
//         </>
//     )
// }

// export default Charts


import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const Charts = ({ dataList, keyX = 'lead', keyY = 'booking' }) => {
    const chartData = Array.isArray(dataList)
        ? dataList.map((row) => ({
            ...row,
            [keyX]: toNumber(row?.[keyX]),
            [keyY]: toNumber(row?.[keyY]),
        }))
        : [];

    const getYAxisTicks = () => {
        const maxX = Math.max(0, ...chartData.map((row) => row[keyX]));
        const maxY = Math.max(0, ...chartData.map((row) => row[keyY]));
        const maxValue = Math.ceil(Math.max(maxX, maxY));
        if (maxValue <= 0) return [0];

        const interval = Math.max(1, Math.ceil(maxValue / 10));
        const ticks = [];
        for (let i = 0; i <= maxValue; i += interval) {
            ticks.push(i);
        }
        return ticks;
    };

    return (
        <>
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <XAxis dataKey="date" />
                        <YAxis ticks={getYAxisTicks()} allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey={keyX} fill="#8884d8" />
                        <Bar dataKey={keyY} fill="#82ca9d" />
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <></>
            )}
        </>
    );
};

export default Charts;