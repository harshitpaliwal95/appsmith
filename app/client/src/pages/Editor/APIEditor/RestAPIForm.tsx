import React, { useContext } from "react";
import { connect } from "react-redux";
import type { InjectedFormProps } from "redux-form";
import { change, formValueSelector, reduxForm } from "redux-form";
import { API_EDITOR_FORM_NAME } from "ee/constants/forms";
import type { Action } from "entities/Action";
import PostBodyData from "./PostBodyData";
import type { AppState } from "ee/reducers";
import { getApiName } from "selectors/formSelectors";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import get from "lodash/get";
import type { Datasource } from "entities/Datasource";
import {
  getAction,
  getActionData,
  getActionResponses,
} from "ee/selectors/entitiesSelector";
import { isEmpty } from "lodash";
import type { CommonFormProps } from "./CommonEditorForm";
import CommonEditorForm from "./CommonEditorForm";
import Pagination from "./Pagination";
import { getCurrentEnvironmentId } from "ee/selectors/environmentSelectors";
import { ApiEditorContext } from "./ApiEditorContext";
import { actionResponseDisplayDataFormats } from "../utils";
import { HTTP_METHOD_OPTIONS } from "constants/ApiEditorConstants/CommonApiConstants";

type APIFormProps = {
  httpMethodFromForm: string;
} & CommonFormProps;

type Props = APIFormProps & InjectedFormProps<Action, APIFormProps>;

function ApiEditorForm(props: Props) {
  const { closeEditorLink } = useContext(ApiEditorContext);
  const { actionName } = props;
  const theme = EditorTheme.LIGHT;

  return (
    <CommonEditorForm
      {...props}
      bodyUIComponent={
        <PostBodyData dataTreePath={`${actionName}.config`} theme={theme} />
      }
      closeEditorLink={closeEditorLink}
      formName={API_EDITOR_FORM_NAME}
      httpsMethods={HTTP_METHOD_OPTIONS}
      paginationUIComponent={
        <Pagination
          actionName={actionName}
          onTestClick={props.onRunClick}
          paginationType={props.paginationType}
          theme={theme}
        />
      }
    />
  );
}

const selector = formValueSelector(API_EDITOR_FORM_NAME);

interface ReduxDispatchProps {
  updateDatasource: (datasource: Datasource) => void;
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapDispatchToProps = (dispatch: any): ReduxDispatchProps => ({
  updateDatasource: (datasource) => {
    dispatch(change(API_EDITOR_FORM_NAME, "datasource", datasource));
  },
});

export default connect((state: AppState, props: { pluginId: string }) => {
  const httpMethodFromForm = selector(state, "actionConfiguration.httpMethod");
  const actionConfigurationHeaders =
    selector(state, "actionConfiguration.headers") || [];
  const autoGeneratedActionConfigHeaders =
    selector(state, "actionConfiguration.autoGeneratedHeaders") || [];
  const actionConfigurationParams =
    selector(state, "actionConfiguration.queryParameters") || [];
  let datasourceFromAction = selector(state, "datasource");

  if (datasourceFromAction && datasourceFromAction.hasOwnProperty("id")) {
    datasourceFromAction = state.entities.datasources.list.find(
      (d) => d.id === datasourceFromAction.id,
    );
  }

  // get messages from action itself
  const actionId = selector(state, "id");
  const action = getAction(state, actionId);
  const currentEnvironment = getCurrentEnvironmentId(state);
  const hintMessages = action?.messages;

  const datasourceHeaders =
    get(
      datasourceFromAction,
      `datasourceStorages.${currentEnvironment}.datasourceConfiguration.headers`,
    ) || [];
  const datasourceParams =
    get(
      datasourceFromAction,
      `datasourceStorages.${currentEnvironment}.datasourceConfiguration.queryParameters`,
    ) || [];

  const apiId = selector(state, "id");
  const currentActionDatasourceId = selector(state, "datasource.id");

  const actionName = getApiName(state, apiId) || "";

  const responses = getActionResponses(state);
  const actionResponse = responses[apiId];
  let hasResponse = false;
  let suggestedWidgets;

  if (actionResponse) {
    hasResponse =
      !isEmpty(actionResponse.statusCode) &&
      actionResponse.statusCode[0] === "2";
    suggestedWidgets = actionResponse.suggestedWidgets;
  }

  const actionData = getActionData(state, apiId);
  const { responseDataTypes, responseDisplayFormat } =
    actionResponseDisplayDataFormats(actionData);

  return {
    actionName,
    actionResponse,
    apiId,
    httpMethodFromForm,
    actionConfigurationHeaders,
    actionConfigurationParams,
    autoGeneratedActionConfigHeaders,
    currentActionDatasourceId,
    datasourceHeaders,
    datasourceParams,
    hintMessages,
    datasources: state.entities.datasources.list.filter(
      (d) => d.pluginId === props.pluginId,
    ),
    currentPageId: state.entities.pageList.currentPageId,
    applicationId: state.entities.pageList.applicationId,
    responseDataTypes,
    responseDisplayFormat,
    suggestedWidgets,
    hasResponse,
  };
}, mapDispatchToProps)(
  reduxForm<Action, APIFormProps>({
    form: API_EDITOR_FORM_NAME,
    enableReinitialize: true,
  })(ApiEditorForm),
);
