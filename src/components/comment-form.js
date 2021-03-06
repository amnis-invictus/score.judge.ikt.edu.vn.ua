import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';

import api, { clientId } from '../api/action-cable';
import commentsSlice from '../state/comments';

const ResultForm = ({ user }) => {
  const lock = `${user}:comment`;
  const commment = useSelector(s => s.comments[user]);
  const lockedId = useSelector(s => s.locks[lock]);
  const dispatch = useDispatch();
  const [focused, setFocused] = useState(false);

  const { value, dirty } = commment || { value: '' };
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
    e => lockAcquired && dispatch(commentsSlice.actions.dirtyUpdate({ user, value: e.target.value })),
    [user, dispatch, lockAcquired]
  );

  useEffect(
    () => dirty && api.perform('write_comment', { user, value, token: dirty }),
    [user, value, dirty]
  );

  useEffect(
    () => {
      if (dirty && !lockAcquired) {
        const timeout = setTimeout(() => api.perform('reset_comment', { user }), 10000);
        return () => clearTimeout(timeout);
      }
    },
    [user, dirty, lockAcquired]
  );

  return (
    <div className='position-relative'>
      <div className='input-group'>
        <input
          className={inputClassName}
          type='text'
          style={{ width: 400 }}
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
