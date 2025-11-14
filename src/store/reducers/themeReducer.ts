import { ThemeActionTypes, ThemeState } from '../types/themeTypes';

const initialState: ThemeState = {
  mode: 'system',
};

const themeReducer = (state = initialState, action: ThemeActionTypes): ThemeState => {
  switch (action.type) {
    case 'SET_THEME_MODE':
    case 'LOAD_THEME_MODE':
      return {
        ...state,
        mode: action.payload,
      };
    default:
      return state;
  }
};

export default themeReducer;

