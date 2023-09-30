import { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import TextareaAutosize from 'react-textarea-autosize';

import api, { clientId, task } from '../api/action-cable';
import commentsSlice from '../state/comments';

const DEFAULT_COMMENTS = ['Немає роботи', 'Робота з умови', 'Пустий файл',
                          'Пустий файл 0 Кб. Не відкривається.', 'Не відкривається (не пустий файл)'];

const ResultForm = ({ user }) => {
  const lock = `${task}:${user}:comment`;
  const readOnly = useSelector(s => s.app.readOnly);
  const comment = useSelector(s => s.comments[user]);
  const lockedId = useSelector(s => s.locks[lock]);
  const dispatch = useDispatch();
  const [focused, setFocused] = useState(false);

  const { value, dirty } = comment || { value: '' };
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
    e => dispatch(commentsSlice.actions.dirtyUpdate({ user, value: e.target.value })),
    [user, dispatch]
  );

  const onDropdownItemClick = useCallback(
    e => {
      api.perform('write_comment', { user, value: e.target.innerText });
      api.perform('zero_results', { user });
    },
    [user]
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

  if (readOnly) {
    return <div>{value}</div>;
  }

  return (
    <div className='position-relative'>
      <div className='input-group' style={{ minWidth: 400 }}>
        <TextareaAutosize
          className={inputClassName}
          value={value}
          disabled={lockedId && !lockAcquired}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur} />
        {!value && !dirty && <>
          <button
            className='btn btn-outline-secondary dropdown-toggle'
            type='button'
            data-bs-toggle='dropdown' />
          <ul className='dropdown-menu dropdown-menu-end'>
            {DEFAULT_COMMENTS.map((c, i) => <li key={i}>
              <button className='dropdown-item' onClick={onDropdownItemClick}>
                {c}
              </button>
            </li>)}
          </ul>
        </>}
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
