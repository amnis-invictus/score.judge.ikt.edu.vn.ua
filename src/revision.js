const style = {
  position: 'fixed',
  bottom: 0,
  right: 0,
  padding: '5px',
  fontSize: '12px',
  color: '#888',
  pointerEvents: 'none',
};

const Revision = () => {
  return (
    <div style={style}>
      {process.env.REACT_APP_REVISION}
    </div>
  );
};

export default Revision;
