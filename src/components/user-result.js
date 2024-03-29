import { shallowEqual, useSelector } from 'react-redux';
import { round } from 'lodash';

const UserResult = ({ user }) => {
  const values = useSelector(
    s => s.results[user] && Object.values(s.results[user]).map(r => r.value).filter(x => x).map(parseFloat),
    shallowEqual
  );
  const rmValue = useSelector(s => s.resultMultiplier).split('/');

  const rmNumerator = parseInt(rmValue[0]);
  const rmDenominator = rmValue[1] ? parseInt(rmValue[1]) : 1;

  const result = values && (values.reduce((x, y) => x + y, 0) * rmNumerator / rmDenominator);

  return (
    <div className='input-group'>
      {result && round(result, 2)}
    </div>
  );
};

export default UserResult;
