import { useCallback, useEffect, useState } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';

import api, { clientId, task } from '../api/action-cable';
import resultsSlice from '../state/results';

const ResultForm = ({ user, criterion, max }) => {
  const lock = `${task}:${user}:${criterion}`;
  const readOnly = useSelector(s => s.app.readOnly);
  const result = useSelector(s => s.results[user]?.[criterion], shallowEqual);
  const lockedId = useSelector(s => s.locks[lock]);
  const dispatch = useDispatch();
  const [focused, setFocused] = useState(false);

  const { value, dirty } = result || { value: '' };
  const lockAcquired = lockedId === clientId;
  const status = focused ? (lockAcquired ? (dirty ? 'warning' : 'success') : 'danger') : (dirty ? 'danger' : 'success');
  const inputClassName = classNames('form-control', 'border', {
    'border-danger': status === 'danger',
    'text-danger': status === 'danger',
    'border-warning': status === 'warning',
    'border-success': status === 'success',
  });

  const onFocus = useCallback(
    () => { setFocused(true); api.perform('acquire_lock', { lock }); },
    [lock, setFocused]
  );

  const onBlur = useCallback(
    () => { setFocused(false); api.perform('release_lock', { lock }); },
    [lock, setFocused]
  );

  const onChange = useCallback(
    e => dispatch(resultsSlice.actions.dirtyUpdate({ user, criterion, value: e.target.value })),
    [user, criterion, dispatch]
  );

  useEffect(
    () => {
      const looksValid = typeof(value) === "number" || (value !== "" && !value.endsWith('.'));
      if (dirty && looksValid)
        api.perform('write_result', { user, criterion, value, token: dirty })
    },
    [user, criterion, value, dirty]
  );

  useEffect(
    () => {
      if (dirty && !lockAcquired) {
        const timeout = setTimeout(() => api.perform('reset_result', { user, criterion }), 10000);
        return () => clearTimeout(timeout);
      }
    },
    [user, criterion, dirty, lockAcquired]
  );

  if (readOnly) {
    return <div>{value}</div>;
  }

  return (
    <div className='position-relative'>
      <div className='input-group'>
        <input
          className={inputClassName}
          type='number'
          style={{ width: 80 }}
          min={0}
          max={max}
          value={value}
          disabled={lockedId && !lockAcquired}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur} />
      </div>

      {focused && <div className={`status-notice status-notice__${status}`}>
        {status === 'danger' && 'Acquiring lock ...'}
        {status === 'warning' && 'Saving ...'}
        {status === 'success' && 'Ready'}
      </div>}
    </div>
  );
};

export default ResultForm;
