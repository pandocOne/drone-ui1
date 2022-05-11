import classNames from 'classnames/bind';
import PropTypes from 'prop-types';
import React, { useLayoutEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import Avatar from 'components/shared/avatar';
import Status from 'components/shared/status';
import ZeroState from 'components/shared/zero-state';
import { useBranches } from 'hooks/swr';

import styles from './branches.module.scss';

const cx = classNames.bind(styles);

export default function Branches({ repo }) {
  const { active: isRepoActive } = repo;
  const { namespace, name } = useParams();
  const { data, isLoading } = useBranches({ namespace, name });

  const history = useHistory();

  // if repo is inactive, redirect to settings where
  // user can proceed with repo activation
  useLayoutEffect(() => {
    if (!isRepoActive) {
      history.replace(`/${namespace}/${name}/settings`);
    }
  }, [isRepoActive, history, namespace, name]);

  let content = null;

  if (isLoading) {
    // TODO(bradrydzewski) set the content to a loading indicator
    // once we have the mockups from the design team.
    content = null;
  } else if (data.length) {
    content = (
      <section className={cx('wrapper')}>
        <div className={cx('inner')}>
          <BranchListView data={data} />
        </div>
      </section>
    );
  } else {
    content = (
      <ZeroState title="分支列表为空." message="你给一个开放分支执行pipeline时会生成分支列表." />
    );
  }
  return (
    <>
      {content}
    </>
  );
}

Branches.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      namespace: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
};

//
// TODO move to component
//

function BranchListView(props) {
  const { data } = props;
  return (
    <>
      <div className={cx('branch-list-header')}>
        <div />
        <div>分支</div>
        <div>提交Commit</div>
        <div>提交人</div>
        <div>提交信息</div>
      </div>
      <div className={cx('branch-list')}>
        {data.map((build) => (
          <Link to={`${build.number}`} key={build.id}>
            <div className={cx('branch-list-item')}>
              <div>
                <Status status={build.status} />
              </div>
              <div className={cx('target')}>{build.target}</div>
              <div className={cx('commit')}>{build.after.slice(0, 8)}</div>
              <div>
                <Avatar
                  className={cx('avatar')}
                  path={build.author_avatar}
                  alt={build.author_login}
                  text={build.author_login}
                />
                <span>{build.author_login}</span>
              </div>
              {build.message && (
                <div className={cx('message')}><span>{build.message}</span></div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
