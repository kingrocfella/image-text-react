import { combineReducers } from 'redux';
import authReducer from './authReducer';
import imageReducer from './imageReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  image: imageReducer,
});

export default rootReducer;

