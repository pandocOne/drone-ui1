import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import React, { useState, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';

import { TIMEOUTS } from '_constants';
import Form, { FormSection, Field } from 'components/shared/form';
import Switch from 'components/shared/switch';
import { useToast } from 'hooks';
import { useRepo } from 'hooks/swr';
import { ReactComponent as NotAllowedIcon } from 'svg/not-allowed.svg';
import { axiosWrapper, pick } from 'utils';

import styles from './general.module.scss';

const cx = classNames.bind(styles);

const buildTimeoutsOptions = (timeouts) => timeouts.map((timeout) => ({
  value: timeout,
  key: timeout > 90 ? `${timeout / 60} 小时` : `${timeout} 分钟`,
}));

export default function General({ user, repo }) {
  const { namespace, name } = useParams();
  const {
    mutate,
  } = useRepo({ namespace, name });

  const { showError, showSuccess } = useToast();

  /* States */
  const [settings, setSettings] = useState(null);

  useLayoutEffect(() => {
    if (repo) {
      setSettings(
        pick(repo)(['ignore_pull_requests',
          'ignore_forks',
          'protected',
          'trusted',
          'visibility',
          'timeout',
          'config_path',
          'auto_cancel_pull_requests',
          'auto_cancel_pushes',
          'auto_cancel_running',
        ]),
      );
    }
  }, [repo]);

  const handleDisableRepo = async () => {
    // eslint-disable-next-line
    const userAgreed = confirm('确定要disable本库?');
    if (userAgreed) {
      try {
        await axiosWrapper(`/api/repos/${namespace}/${name}`, { method: 'DELETE' });
        mutate();
        showSuccess('库已被disabled');
      } catch (e) {
        showError(`无法disable库: ${e.message}`);
        // eslint-disable-next-line no-console
        console.warn(e.message);
      }
    }
  };

  const handleSettingsSubmit = async () => {
    try {
      const res = await axiosWrapper(`/api/repos/${namespace}/${name}`, { method: 'PATCH', data: { ...settings, timeout: +settings.timeout } });
      mutate(res);
      showSuccess('已保存修改');
    } catch (e) {
      showError(`无法保存修改: ${e.message}`);
      // eslint-disable-next-line no-console
      console.warn(e.message);
    }
  };

  const handleSettingsChange = (field) => (event) => {
    switch (field) {
      case 'ignore_pull_requests':
      case 'ignore_forks':
      case 'protected':
      case 'trusted':
      case 'auto_cancel_running':
        setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
        break;
      case 'auto_cancel_pull_requests':
        setSettings((prev) => ({
          ...prev,
          [field]: !prev[field],
          auto_cancel_running: prev.auto_cancel_pushes ? prev.auto_cancel_running : false,
        }));
        break;
      case 'auto_cancel_pushes':
        setSettings((prev) => ({
          ...prev,
          [field]: !prev[field],
          auto_cancel_running: prev.auto_cancel_pull_requests ? prev.auto_cancel_running : false,
        }));
        break;
      case 'visibility':
      case 'config_path':
      case 'timeout':
        setSettings((prev) => ({ ...prev, [field]: event.target.value }));
        break;
      default:
    }
  };
  if (settings === null) return null;
  return (
    <div className={cx('wrapper')}>
      <div className={cx('inner')}>
        <Form className={cx('form')}>
          <FormSection className={cx('form-section-row')} title="项目 Webhooks">
            <div className={cx('switch-row')}>
              <Switch
                id="ignore_pull_requests"
                checked={settings.ignore_pull_requests}
                onChange={handleSettingsChange('ignore_pull_requests')}
              >
                禁止Pull Requests
              </Switch>
            </div>
            <div className={cx('switch-row')}>
              <Switch
                id="ignore_forks"
                checked={settings.ignore_forks}
                onChange={handleSettingsChange('ignore_forks')}
              >
                禁止forks
              </Switch>
            </div>
          </FormSection>
          <FormSection className={cx('form-section-row')} title="项目设置">
            <div className={cx('switch-row')}>
              <Switch
                id="protected"
                checked={settings.protected}
                onChange={handleSettingsChange('protected')}
              >
                Protected
              </Switch>
              <p className={cx('note')}>
                如果无法验证 yaml 签名，则阻止管道(pipeline)。
              </p>
            </div>
            {user?.admin && (
              <>
                <div className={cx('switch-row')}>
                  <Switch
                    id="trusted"
                    checked={settings.trusted}
                    onChange={handleSettingsChange('trusted')}
                  >
                    Trusted
                  </Switch>
                  <p className={cx('note')}>
                    启用特权容器设置。
                  </p>
                </div>
                <div className={cx('switch-row')}>
                  <Switch
                    id="auto_cancel_pull_requests"
                    checked={settings.auto_cancel_pull_requests}
                    onChange={handleSettingsChange('auto_cancel_pull_requests')}
                  >
                    自动取消PR
                  </Switch>
                  <p className={cx('note')}>
                    自动取消挂起的Pull Request Builds.
                  </p>
                </div>
                <div className={cx('switch-row')}>
                  <Switch
                    id="auto_cancel_pushes"
                    checked={settings.auto_cancel_pushes}
                    onChange={handleSettingsChange('auto_cancel_pushes')}
                  >
                    自动取消push
                  </Switch>
                  <p className={cx('note')}>
                    自动取消挂起的push builds.
                  </p>
                </div>
                <div className={cx('switch-row')}>
                  <Switch
                    id="auto_cancel_running"
                    checked={settings.auto_cancel_running}
                    disabled={!settings.auto_cancel_pull_requests && !settings.auto_cancel_pushes}
                    onChange={handleSettingsChange('auto_cancel_running')}
                  >
                    自动取消正运行
                  </Switch>
                  <p className={cx('note')}>
                    如果有新的提交推送上来，自动取消正在运行的build。
                  </p>
                </div>
              </>
            )}
          </FormSection>
          <FormSection className={cx('form-section-row')} title="项目可见性">
            <ul className={cx('visibility-container')}>
              <li className={cx('visibility-card-wrapper')}>
                <div className={cx('visibility-card')}>
                  <h4>私有</h4>
                  <p>私有库只有你明确与之共享访问权限的人才能访问。</p>
                </div>
                <Field.Radio
                  name="private"
                  checked={settings.visibility === 'private'}
                  value="private"
                  appearance="checkmark"
                  onChange={handleSettingsChange('visibility')}
                />
              </li>
              <li className={cx('visibility-card-wrapper')}>
                <div className={cx('visibility-card')}>
                  <h4>公共</h4>
                  <p>公共库所有能访问本服务器的人都能访问。</p>
                </div>
                <Field.Radio
                  name="public"
                  value="public"
                  appearance="checkmark"
                  checked={settings.visibility === 'public'}
                  onChange={handleSettingsChange('visibility')}
                />
              </li>

              <li className={cx('visibility-card-wrapper')}>
                <div className={cx('visibility-card')}>
                  <h4>内部</h4>
                  <p>内部库只有认证用户才可以访问。</p>
                </div>
                <Field.Radio
                  name="internal"
                  checked={settings.visibility === 'internal'}
                  value="internal"
                  appearance="checkmark"
                  onChange={handleSettingsChange('visibility')}
                />
              </li>
            </ul>
          </FormSection>
          <FormSection className={cx('form-section-row', 'form-section-row-is-last')}>
            <Field.Select
              label="超时"
              value={settings.timeout}
              optionsList={buildTimeoutsOptions(TIMEOUTS)}
              width={200}
              className={cx('timeout')}
              onChange={handleSettingsChange('timeout')}
            />
            <Field.Input
              label="配置文件"
              name="configuration"
              value={settings.config_path}
              width={372}
              className={cx('config')}
              onChange={handleSettingsChange('config_path')}
            />
          </FormSection>
          <div className={cx('controls')}>

            <button
              className={cx('btn', 'btn-save')}
              type="button"
              onClick={handleSettingsSubmit}
            >
              保存修改
            </button>
            <button
              className={cx('btn', 'btn-disable')}
              type="button"
              onClick={handleDisableRepo}
            >
              <NotAllowedIcon />
              禁用
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}

General.propTypes = {
  repo: PropTypes.shape().isRequired,
  user: PropTypes.shape({
    admin: PropTypes.bool.isRequired,
  }).isRequired,
};
