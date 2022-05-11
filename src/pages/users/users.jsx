import classNames from 'classnames/bind';
import React, { useCallback, useMemo, useState } from 'react';

import { EditUserForm, NewUserForm } from 'components/pages/users/user-form';
import UserList from 'components/pages/users/user-list';
import Button from 'components/shared/button';
import Modal, { useModal } from 'components/shared/modal';
import { useCustomTitle, useToast } from 'hooks';
import { useUserList } from 'hooks/swr';
// @TODO: use a proper user icon
import { ReactComponent as DemoIcon } from 'svg/demo.svg';
import { pick, axiosWrapper } from 'utils';

import css from './users.module.scss';

const cx = classNames.bind(css);

const USERS_CHUNK_SIZE = 1000;

const sortUsersAlphabetically = (users) => users.sort((a, b) => a.login - b.login);

export default function Users({ user: currentUser }) {
  const [showAllUsers, setShowAllUsers] = useState(false);
  useCustomTitle('用户管理');
  const { showError, showSuccess } = useToast();
  const { data, isLoading, mutate } = useUserList();
  const [isModalShowing, toggleModal] = useModal();
  const [modalUserId, setModalUserId] = useState('new'); // ['new', `${id}`]
  const users = useMemo(
    () => sortUsersAlphabetically(data?.slice(0, showAllUsers
      ? data?.length : USERS_CHUNK_SIZE) ?? []), [data, showAllUsers],
  );

  const handleShowMoreClick = () => setShowAllUsers(true);
  const handleNewUserClick = () => {
    setModalUserId('new');
    toggleModal();
  };
  const handleEditUserClick = (userId) => () => {
    setModalUserId(userId);
    toggleModal();
  };

  const handleUserFormSubmit = useCallback(async (values) => {
    try {
      await axiosWrapper('/api/users', {
        method: 'POST',
        data: {
          ...values,
        },
      });
      mutate();
      showSuccess('新用户创建成功');
    } catch (err) {
      showError(`无法创建新用户: ${err.message}`);
      // eslint-disable-next-line no-console
      console.warn(err.message);
    }
  }, [mutate, showError, showSuccess]);

  const handleEditUserFormSubmit = useCallback(async (values) => {
    const { admin, login } = values;
    try {
      await axiosWrapper(`/api/users/${login}`, {
        method: 'PATCH',
        data: {
          admin,
        },
      });
      mutate();
      showSuccess('用户设置已更新');
    } catch (err) {
      showError(`无法更新用户: ${err.message}`);
      // eslint-disable-next-line no-console
      console.warn(err.message);
    }
  }, [mutate, showError, showSuccess]);

  const handleUserDelete = useCallback(async (login) => {
    const userAgreed = confirm('确定要删除此用户?');
    if (userAgreed) {
      try {
        await axiosWrapper(`/api/users/${login}`, { method: 'DELETE' });
        setModalUserId('new');
        mutate((prev) => prev.filter((user) => user.login !== login), false);
        showSuccess('用户已被成功删除');
      } catch (e) {
        showError(`无法删除用户: ${e.message}`);
        // eslint-disable-next-line
      console.error(e)
      }
    }
  }, [mutate, showError, showSuccess]);

  return (
    <>
      <section className={cx('wrapper')}>
        <div className={cx('card')}>
          <div className={cx('actions')}>
            <Button
              theme="primary"
              className={cx('btn', 'btn-user')}
              icon={<DemoIcon />}
              onClick={handleNewUserClick}
            >
              新建用户
            </Button>
          </div>
          {isLoading ? <p>加载中...</p> : (
            <UserList
              users={users}
              currentUser={currentUser}
              handleEditUserClick={handleEditUserClick}
            />
          )}
          {!showAllUsers && data?.length > USERS_CHUNK_SIZE && (
          <Button
            className={cx('btn', 'btn-show-more')}
            onClick={handleShowMoreClick}
          >
            显示更多 &#8595;

          </Button>
          )}
        </div>
      </section>
      <Modal
        title={modalUserId === 'new' ? '创建新用户' : '编辑用户'}
        isShowing={isModalShowing}
        hide={toggleModal}
      >
        {modalUserId === 'new' ? (

          <NewUserForm
            handleSubmit={handleUserFormSubmit}
            handleCancel={toggleModal}
          />
        ) : (
          <EditUserForm
            handleSubmit={handleEditUserFormSubmit}
            handleDelete={handleUserDelete}
            handleCancel={toggleModal}
            initialValues={pick(users.find((user) => user.id === modalUserId))(['machine', 'admin', 'login'])}
          />
        )}
      </Modal>
    </>
  );
}
