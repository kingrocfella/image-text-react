import { combineReducers } from 'redux';
import authReducer from './authReducer';
import imageReducer from './imageReducer';
import pdfReducer from './pdfReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  image: imageReducer,
  pdf: pdfReducer,
});

export default rootReducer;

