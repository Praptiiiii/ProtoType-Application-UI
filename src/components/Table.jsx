
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import React, { useState, useRef, useEffect } from 'react';
import { HotTable } from '@handsontable/react';
import './Table.css';
 
function Table() {
    const hot = useRef(null);
    const [data, setData] = useState(() => {
        const storedData = localStorage.getItem('tableData');
        return storedData ? JSON.parse(storedData) : [];
    });
    const [columns, setColumns] = useState(() => {
        const storedColumns = localStorage.getItem('tableColumns');
        return storedColumns ? JSON.parse(storedColumns) : [];
    });
 
    useEffect(() => {
        localStorage.setItem('tableData', JSON.stringify(data));
        // calculateGrandTotal();
    }, [data]);
 
    useEffect(() => {
        localStorage.setItem('tableColumns', JSON.stringify(columns));
    }, [columns]);
 
    const addColumn = () => {
        let columnName;
        let category;
 
        if (columns.length === 0) {
            columnName = prompt('Enter name for the first column:');
            category = 'collectionName';
        } else {
            const categoryInput = prompt('Enter category for the new column: (a for attribute, y for yearValue)').toLowerCase();
 
            if (categoryInput === 'a') {
                columnName = prompt('Enter name for the new attribute column:');
                category = 'attribute';
            } else if (categoryInput === 'y') {
                columnName = prompt('Enter name for the new yearValue column:');
                category = 'yearvalue';
            } else {
                alert('Invalid category. Please enter "a" for attribute or "y" for yearValue.');
                return;
            }
        }
 
        // Determine the index to insert the new column
        const insertIndex = category === 'attribute' ? 1 : columns.length;
 
        setColumns(prevColumns => [
            ...prevColumns.slice(0, insertIndex),
            { label: columnName, category },
            ...prevColumns.slice(insertIndex),
        ]);
 
        setData(prevData =>
            prevData.map(row => ({
                ...row,
                data: [
                    ...row.data.slice(0, insertIndex),
                    '',
                    ...row.data.slice(insertIndex),
                ],
            }))
        );
    };

    const [subTotalOption, setSubTotalOption] = useState(null);

    const [subTotalCategory, setSubTotalCategory] = useState(null);

    const handleSubTotal = () => {
        const categoryInput = prompt('Enter category for sub-total ("a" for attribute, "c" for collectionName):').toLowerCase();

        if (categoryInput === 'a' || categoryInput === 'c') {
            const subTotalOption = categoryInput === 'a' ? 'attribute' : 'collectionName';
            setSubTotalCategory(subTotalOption);

            const namePrompt = prompt(`Enter the name of the ${subTotalOption === 'attribute' ? 'attribute' : 'collectionName'} for sub-total:`);
            
            if (namePrompt) {
                calculateSubTotal(subTotalOption, namePrompt);
            } else {
                alert('Invalid or empty name. Please try again.');
            }
        } else {
            alert('Invalid category. Please enter "a" for attribute or "c" for collectionName.');
        }
    };

    const calculateSubTotal = (category, name) => {
        const subTotalData = {};
    
        columns.forEach((column, index) => {
            if (column.category === 'yearvalue') {
                const columnName = column.label;
                const total = data
                    .filter(row => row.rowType === 'simple' && row.data[0] === name)
                    .reduce((sum, row) => sum + (parseInt(row.data[index], 10) || 0), 0);
                subTotalData[columnName] = total;
            }
        });
    
        // Allow the user to select a specific row for subtotal
        const selectedRowIndex = prompt('Enter the row number where you want to display the subtotal:') || 0;
        const insertIndex = Math.min(selectedRowIndex, data.length);
    
        setData(prevData => {
            const newData = [...prevData];
            const subTotalRow = columns.map((col, index) => {
                if (index === 0) {
                    return `${name} total`;
                } else {
                    return subTotalData[col.label] || '';
                }
            });
    
            newData.splice(insertIndex, 0, { data: subTotalRow, rowType: 'subtotal' });
    
            return newData;
        });
    };
    
 
    const addRow = (isTotalRow = false) => {
        const newRow = columns.map(() => '');
        const newRowData = { data: newRow, rowType: isTotalRow ? 'total' : 'simple' };
        setData(prevData => [...prevData, newRowData]);
    };

    
    
    const calculateGrandTotal = () => {
        const newGrandTotal = {};
    
        columns.forEach((column, index) => {
            if (index === 0) {
                newGrandTotal[column.label] = 'GRAND TOTAL';
            } else if (column.category === 'yearvalue') {
                const yearColumnName = column.label;
                const yearTotal = data
                    .filter(row => row.rowType === 'simple') // Calculate total only for row type 'simple'
                    .reduce((sum, row) => sum + (parseInt(row.data[index], 10) || 0), 0);
                newGrandTotal[yearColumnName] = yearTotal;
            }
        });
    
        setData(prevData => {
            const newData = prevData.map(row => ({ ...row }));
            const grandTotalRow = columns.map((col, index) => newGrandTotal[col.label] || '');
    
            const existingGrandTotalIndex = newData.findIndex(row => row.rowType === 'grandtotal');
            if (existingGrandTotalIndex !== -1) {
                newData[existingGrandTotalIndex].data = grandTotalRow;
            } else {
                // Add the grand total row at the last position if it doesn't exist
                newData.push({ data: grandTotalRow, rowType: 'grandtotal' });
            }
    
            return newData;
        });
    };

    
    
    
 
    const handleAfterChange = (changes, source) => {
        if (source === 'edit') {
            const [row, prop, oldValue, newValue] = changes[0];
 
            // Check if the changed cell is in the last column
            if (prop === columns[columns.length - 1].label) {
                // Save the data without adding a new row for total rows
                const currentRow = data[row];
                if (currentRow.rowType === 'simple') {
                    localStorage.setItem('tableData', JSON.stringify(data));
                }
                return;
            }
 
            setData(prevData => {
                const newData = [...prevData];
                newData[row].data[prop] = newValue;
                return newData;
            });
        }
    };
 
    function mergeDataWithHeaders(headers, selectedData) {
        const result = {
            rowType: 'simple',
            data: {
                name: headers.find(column => column.category === 'collectionName').label,
                collectionName: selectedData[0],
                attributes: {},
                yearValue: {}
            }
        };
 
        headers.forEach((column, index) => {
            if (index > 0) {
                const columnName = column.label;
                const category = column.category;
 
                if (category === 'attribute') {
                    result.data.attributes[columnName] = selectedData[index];
                } else if (category === 'yearvalue') {
                    result.data.yearValue[columnName] = parseInt(selectedData[index]);
                }
            }
        });
 
        return result;
    }
 
    const handleCustomAction = (key, options) => {
        const selectedRange = Array.isArray(options) && options.length > 0 ? options[0] : null;
 
        if (selectedRange && selectedRange.start && selectedRange.start.row !== null) {
            const selectedRow = selectedRange.start.row;
            const selectedData = hot.current.hotInstance.getSourceDataAtRow(selectedRow);
 
            const mergedData = mergeDataWithHeaders(columns, selectedData);
            console.log('Merged Data:', mergedData);
        } else {
            console.error('Invalid options:', options);
        }
    };
 
    const createRowAsTotal = (key, options) => {
        const selectedRange = Array.isArray(options) && options.length > 0 ? options[0] : null;
 
        if (selectedRange && selectedRange.start && selectedRange.start.row !== null) {
            const selectedRow = selectedRange.start.row;
            setData(prevData =>
                prevData.map((row, index) => ({
                    ...row,
                    rowType: index === selectedRow ? 'total' : row.rowType,
                }))
            );
 
            setData(updatedData => {
                const updatedRow = updatedData[selectedRow];
                console.log('Updated Row:', updatedRow);
 
                localStorage.setItem('tableData', JSON.stringify(updatedData));
                return updatedData;
            });
        }
 
    };
 
    const customContextMenu = [
        'row_below',
        '---------',
        {
            key: 'remove_row',
            name: 'Remove Row',
            callback: (key, options) => {
                const selectedRange = Array.isArray(options) && options.length > 0 ? options[0] : null;
 
                if (selectedRange && selectedRange.start && selectedRange.start.row !== null) {
                    const selectedRow = selectedRange.start.row;
 
                    setData(prevData =>
                        prevData.filter((row, index) => index !== selectedRow)
                    );
 
                    // Using the callback form of setData to ensure the state has been updated
                    setData(updatedData => {
                        localStorage.setItem('tableData', JSON.stringify(updatedData));
                        return updatedData; // Return the updated data to set it in the state
                    });
                }
            },
        },
        '---------',
        'copy',
        'cut',
        'paste',
        '---------',
        {
            key: 'custom_action',
            name: 'Get Row Detail',
            callback: handleCustomAction,
        },
        {
            key: 'custom_action_2',
            name: 'Create Total-Row',
            callback: createRowAsTotal,
        },
    ];
 
    return (
        <div>
            <button onClick={addColumn}>Add Column</button><br />
            <button onClick={() => addRow()}>Add Row</button><br />
            <button onClick={calculateGrandTotal}>Grand Total</button><br />
            <button onClick={handleSubTotal}>Sub Total</button>
            
            <HotTable
                ref={hot}
                data={data.map(row => row.data)}
                colHeaders={columns.map(column => column.label)}
                rowHeaders={true}
                height="auto"
                licenseKey="non-commercial-and-evaluation"
                contextMenu={customContextMenu}
                afterChange={handleAfterChange}
                
            />
        </div>
    );
}
 
export default Table;
 