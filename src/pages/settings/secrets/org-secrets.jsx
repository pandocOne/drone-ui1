import classNames from 'classnames/bind';
import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import Button from 'components/shared/button';
import Modal, { useModal } from 'components/shared/modal';
import { useToast } from 'hooks';
import { useOrgSecrets } from 'hooks/swr';
import { ReactComponent as DemoIcon } from 'svg/demo.svg';
import { axiosWrapper } from 'utils';

import styles from './secrets.module.scss';
import { NewSecretForm, SecretListView } from './shared';

const cx = classNames.bind(styles);

export default function OrgSecrets() {
  const { namespace } = useParams();
  const { data, isLoading, mutate } = useOrgSecrets({ namespace });
  const [isModalShowing, toggleModal] = useModal();
  const { showError, showSuccess } = useToast();

  const handleAddSecret = useCallback(async (values) => {
    try {
      const res = await axiosWrapper(`/api/secrets/${namespace}`,
        {
          method: 'POST',
          data: values,
        });
      mutate((prev) => prev.concat(res), false);
      showSuccess('组织秘密信息添加成功');
    } catch (e) {
      showError(`无法添加组织秘密信息: ${e.message}`);
      // eslint-disable-next-line no-console
      console.warn(e.message);
    }
  }, [mutate, namespace, showSuccess, showError]);

  const handleRemoveSecret = (secretName) => async () => {
    // eslint-disable-next-line no-alert
    const userAgreed = window.confirm('确定要删除此组织秘密信息?');
    if (userAgreed) {
      try {
        await axiosWrapper(`/api/secrets/${namespace}/${secretName}`, {
          method: 'DELETE',
        });
        mutate(data.filter((secretItem) => secretItem.name !== secretName), false);
        showSuccess('成功删除组织秘密信息');
      } catch (e) {
        showError(`无法删除组织秘密信息: ${e.message}`);
        // eslint-disable-next-line no-console
        console.warn(e.message);
      }
    }
  };

  let secrets = null;
  if (isLoading) {
    secrets = null;
  } else if (data.length) {
    secrets = (
      <SecretListView secrets={data} handleRemove={handleRemoveSecret} />
    );
  } else {
    secrets = (
      <div className={cx('zero')}>
        <h2>没有组织秘密信息</h2>
        <p>管理敏感配置参数，如口令、token、ssh key等.</p>
      </div>
    );
  }
  return (
    <>
      <div className={cx('wrapper')}>
        <div className={cx('card')}>
          <div className={cx('actions')}>
            <Button
              theme="primary"
              className={cx('btn-new')}
              icon={<DemoIcon />}
              onClick={toggleModal}
            >
              新建组织秘密信息
            </Button>
          </div>
          {secrets}
        </div>
      </div>
      <Modal
        title="设置新的组织秘密信息"
        isShowing={isModalShowing}
        hide={toggleModal}
      >
        <NewSecretForm
          handleSubmit={handleAddSecret}
          handleCancel={toggleModal}
        />
      </Modal>
    </>
  );
}
