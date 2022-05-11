import classNames from 'classnames/bind';
import { formatDistanceStrict } from 'date-fns';
import React from 'react';

import Avatar from 'components/shared/avatar';
import Button from 'components/shared/button';
import { ReactComponent as EditIcon } from 'svg/edit.svg';

import css from './user-list.module.scss';

const cx = classNames.bind(css);

// @NOTE: 1. this whole thing should be refactored
// using proper table tags to ensure semantically correct structure
// 2. After that make first column fixed according to responsive table
// patterns, so that scrollable area will include everything besides username

const UserList = (props) => (
  <div className={cx('user-list-wrapper')}>
    <div className={cx('user-list-header')}>
      <div />
      <div>用户名</div>
      <div>激活</div>
      <div>种类</div>
      <div>角色</div>
      <div>创建日期</div>
      <div>最后登录</div>
    </div>
    <div className={cx('user-list')}>
      {props?.users?.map((user) => (
        <UserListItem
          data={user}
          key={user.id}
          isCurrentUser={user.id === props.currentUser.id}
          handleEditClick={props.handleEditUserClick(user.id)}
        />
      ))}
    </div>
  </div>
);

function UserListItem({ data, isCurrentUser, handleEditClick }) {
  return (
    <>
      <div className={cx('user-list-item')}>
        <div>
          <Avatar className={cx('avatar')} text={data.login} path={data.avatar} alt={data.login} />
        </div>
        <div>{data.login}</div>
        <div>{data.active ? '已激活' : '未激活'}</div>
        <div>{data.machine ? '机器' : '用户'}</div>
        <div>{data.admin ? '管理员' : '成员'}</div>
        <div>{formatDistanceStrict(new Date(data.created * 1000), new Date(), { addSuffix: true })}</div>
        <div>
          {data.last_login === 0
            ? ''
            : formatDistanceStrict(new Date(data.last_login * 1000), new Date(), { addSuffix: true })}

        </div>
        <div>
          {!isCurrentUser && (
          <Button onClick={handleEditClick}>
            <EditIcon />
          </Button>
          )}
        </div>
      </div>
    </>
  );
}

export default UserList;
