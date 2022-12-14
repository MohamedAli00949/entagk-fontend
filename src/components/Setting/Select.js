import React, { useState } from 'react';

import { RiArrowUpSLine, RiArrowDownSLine } from 'react-icons/ri';

function Select({ options, setChange, type, data, setData }) {
  const [open, setOpen] = useState(false);
  const realOptions = typeof options[0] === "object" ? options.map((op) => op.name) : options;

  const handleChange = (e) => {
    setData({ ...data, [type]: options[Number(e.target.value)] });
    setChange(true);
  }

  return (
    <div className='select-container'>
      <div className='select-menu menu'>
        <button type='button' aria-label='open menu' className='open-menu' onClick={() => setOpen(!open)}>
          <span>{data[type]?.name || data[type]}</span>
          {open ?
            (<RiArrowUpSLine className='arrow' />) :
            (<RiArrowDownSLine className='arrow' />)
          }</button>
        {open && (
          <div className='menu-content' style={{ width: "max-content", top: 35 }}>
            <div className='row' style={{ width: "100%" }}>
              {realOptions?.map((option, index) => (
                <button key={index} aria-label={option} type='button' onClick={handleChange} value={index} className={data[type].name === option || data[type] === option ? "active" : null}>{option}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Select;